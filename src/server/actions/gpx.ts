"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOptionalSession, requireClubAdmin } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { organizations, trails, trips } from "@/lib/db/schema";
import { parseGpxString } from "@/lib/gpx/parser";
import { isR2Configured, uploadGpx } from "@/lib/storage/r2";
import { generateSlug } from "@/lib/utils/slug";

export interface SubmitTrailResult {
  success: boolean;
  slug?: string;
  error?: string;
}

/**
 * Create a new (unverified) trail from a GPX file. Coordinates, distance,
 * elevation gain, track type and the elevation profile are parsed server-side
 * (source of truth) and the GPX is stored in R2.
 */
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

  const [trail] = await db
    .insert(trails)
    .values({
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
      elevationProfile: parsed.elevationProfile.map((p) => ({
        distance: p.distanceKm,
        elevation: p.elevation,
      })),
      submittedBy: session.user.id,
      verified: false,
    })
    .returning({ id: trails.id, slug: trails.slug });

  if (!trail) return { success: false, error: "Diçka shkoi keq." };

  if (isR2Configured()) {
    try {
      const url = await uploadGpx(`trails/${trail.id}.gpx`, data.gpxContent);
      await db.update(trails).set({ gpxUrl: url }).where(eq(trails.id, trail.id));
    } catch {
      // GPX stats are already saved; the file upload is best-effort.
    }
  }

  revalidatePath("/trails");
  return { success: true, slug: trail.slug };
}

export interface ActionResult {
  success: boolean;
  error?: string;
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
