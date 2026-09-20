"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOptionalSession, requireClubAdmin } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { organizations, trails, trips, users } from "@/lib/db/schema";
import { downsampleTrack, parseGpxString } from "@/lib/gpx/parser";
import {
  enforceRateLimit,
  getClientIp,
} from "@/lib/security/rate-limit";
import { captureError } from "@/lib/sentry";
import { isR2Configured, uploadGpx } from "@/lib/storage/r2";
import { generateSlug } from "@/lib/utils/slug";

export interface SubmitTrailResult {
  success: boolean;
  slug?: string;
  error?: string;
}

export async function submitTrail(data: {
  name: string;
  region?: string;
  city?: string;
  difficulty: "easy" | "moderate" | "hard" | "expert";
  description?: string;
  gpxContent: string;
}): Promise<SubmitTrailResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };
  if (!data.name.trim()) return { success: false, error: "Emri është i detyrueshëm." };

  if (!isR2Configured()) {
    return { success: false, error: "Ruajtja e skedarëve nuk është konfiguruar." };
  }

  let parsed;
  try {
    parsed = await parseGpxString(data.gpxContent);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "GPX i pavlefshëm.",
    };
  }

  const slug = `${generateSlug(data.name)}-${crypto.randomUUID().slice(0, 6)}`;
  const trailId = crypto.randomUUID();

  // R2 upload first — orphaned R2 file on DB failure is fine;
  // a DB row pointing at a nonexistent URL is not.
  let gpxUrl: string;
  try {
    gpxUrl = await uploadGpx(`trails/${trailId}.gpx`, data.gpxContent);
  } catch (error) {
    captureError(error, { action: "submitTrail", extra: { phase: "r2Upload" } });
    return { success: false, error: "Ngarkimi i skedarit GPX dështoi." };
  }

  const gpxTrack = downsampleTrack(parsed.points);

  const [trail] = await db
    .insert(trails)
    .values({
      id: trailId,
      slug,
      name: data.name.trim(),
      description: data.description || null,
      region: data.region || null,
      city: data.city || null,
      difficulty: data.difficulty,
      distanceKm: String(parsed.totalDistanceKm),
      elevationGainM: parsed.totalElevationGainM,
      trailType: parsed.trackType,
      startLat: String(parsed.startLat),
      startLng: String(parsed.startLng),
      endLat: String(parsed.endLat),
      endLng: String(parsed.endLng),
      gpxUrl,
      gpxTrack,
      gpxMetadata: {
        name: parsed.name,
        distanceKm: parsed.totalDistanceKm,
        elevationGainM: parsed.totalElevationGainM,
        elevationLossM: parsed.totalElevationLossM,
        pointCount: parsed.pointCount,
      },
      gpxUploadedAt: new Date(),
      gpxUploadedBy: session.user.id,
      elevationProfile: parsed.elevationProfile.map((p) => ({
        distance: p.distanceKm,
        elevation: p.elevation,
      })),
      submittedBy: session.user.id,
      verified: false,
    })
    .returning({ id: trails.id, slug: trails.slug });

  if (!trail) return { success: false, error: "Diçka shkoi keq." };

  revalidatePath("/trails");
  return { success: true, slug: trail.slug };
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** Upload GPX to an existing trail. Super admins or the trail's submitter only. */
export async function uploadTrailGpx(
  trailId: string,
  gpxContent: string,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  if (!isR2Configured()) {
    return { success: false, error: "Ruajtja e skedarëve nuk është konfiguruar." };
  }

  const ip = await getClientIp();
  const rateLimitError = await enforceRateLimit("ratelimit.trail.gpx.upload", {
    userId: session.user.id,
    ip,
  });
  if (rateLimitError) return { success: false, error: rateLimitError };

  const trail = await db.query.trails.findFirst({
    where: eq(trails.id, trailId),
  });
  if (!trail) return { success: false, error: "Shtegu nuk u gjet." };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { role: true },
  });
  const isSuperAdmin = user?.role === "super_admin";
  const isSubmitter = trail.submittedBy === session.user.id;
  if (!isSuperAdmin && !isSubmitter) {
    return { success: false, error: "Nuk keni qasje." };
  }

  let parsed;
  try {
    parsed = await parseGpxString(gpxContent);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "GPX i pavlefshëm.",
    };
  }

  let gpxUrl: string;
  try {
    gpxUrl = await uploadGpx(`trails/${trailId}.gpx`, gpxContent);
  } catch (error) {
    captureError(error, { action: "uploadTrailGpx", extra: { trailId } });
    return { success: false, error: "Ngarkimi i skedarit GPX dështoi." };
  }

  const gpxTrack = downsampleTrack(parsed.points);

  await db
    .update(trails)
    .set({
      gpxUrl,
      gpxTrack,
      gpxMetadata: {
        name: parsed.name,
        distanceKm: parsed.totalDistanceKm,
        elevationGainM: parsed.totalElevationGainM,
        elevationLossM: parsed.totalElevationLossM,
        pointCount: parsed.pointCount,
      },
      gpxUploadedAt: new Date(),
      gpxUploadedBy: session.user.id,
      distanceKm: String(parsed.totalDistanceKm),
      elevationGainM: parsed.totalElevationGainM,
      trailType: parsed.trackType,
      startLat: String(parsed.startLat),
      startLng: String(parsed.startLng),
      endLat: String(parsed.endLat),
      endLng: String(parsed.endLng),
      elevationProfile: parsed.elevationProfile.map((p) => ({
        distance: p.distanceKm,
        elevation: p.elevation,
      })),
    })
    .where(eq(trails.id, trailId));

  revalidatePath(`/trails/${trail.slug}`);
  revalidatePath("/trails");
  return { success: true };
}

/** Upload a GPX for an existing trip (admin); backfills meeting coordinates. */
export async function uploadTripGpx(
  tripId: string,
  gpxContent: string,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };
  if (!isR2Configured()) {
    return { success: false, error: "Ngarkimi nuk është konfiguruar." };
  }

  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) return { success: false, error: "Udhëtimi nuk u gjet." };

  const club = await db.query.organizations.findFirst({
    where: eq(organizations.id, trip.organizationId),
    columns: { slug: true },
  });
  const access = club
    ? await requireClubAdmin(session.user.id, club.slug)
    : null;
  if (!access) return { success: false, error: "Nuk keni qasje." };

  let parsed;
  try {
    parsed = await parseGpxString(gpxContent);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "GPX i pavlefshëm.",
    };
  }

  try {
    const url = await uploadGpx(`trips/${tripId}/gpx.gpx`, gpxContent);
    await db
      .update(trips)
      .set({
        gpxUrl: url,
        meetingLat: trip.meetingLat ?? String(parsed.startLat),
        meetingLng: trip.meetingLng ?? String(parsed.startLng),
      })
      .where(eq(trips.id, tripId));
  } catch {
    return { success: false, error: "Ngarkimi dështoi." };
  }

  revalidatePath(`/dashboard/club/${club!.slug}/trips/${trip.slug}`);
  revalidatePath(`/trips/${trip.slug}`);
  return { success: true };
}
