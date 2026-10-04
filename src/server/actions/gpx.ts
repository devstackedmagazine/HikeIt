"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOptionalSession, requireClubAdmin } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { organizations, trails, trips, users } from "@/lib/db/schema";
import { downsampleTrack, parseGpxString } from "@/lib/gpx/parser";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { captureError } from "@/lib/sentry";
import { isGpxStorageConfigured, uploadGpx } from "@/lib/storage/gpx-storage";
import { generateSlug } from "@/lib/utils/slug";
import {
  OTHER_REGION,
  type SubmitTrailField,
  type SubmitTrailInput,
  submitTrailSchema,
} from "@/lib/validations/trail-submit";
import { createNotification } from "@/server/queries/notifications";
import { getTrailRegions } from "@/server/queries/trails";

export interface SubmitTrailResult {
  success: boolean;
  slug?: string;
  error?: string;
  /** Per-field messages, shown next to the field. */
  fieldErrors?: Partial<Record<SubmitTrailField, string>>;
}

/** Propose a trail (any signed-in user). Unverified until a super admin
 * approves it; every super admin gets an in-app notification. */
export async function submitTrail(
  data: SubmitTrailInput & { gpxContent: string },
): Promise<SubmitTrailResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const ip = await getClientIp();
  const limited = await enforceRateLimit("ratelimit.trail.submit", {
    userId: session.user.id,
    ip,
  });
  if (limited) return { success: false, error: limited };

  const input = submitTrailSchema.safeParse(data);
  if (!input.success) {
    const fieldErrors: SubmitTrailResult["fieldErrors"] = {};
    for (const issue of input.error.issues) {
      const key = issue.path[0] as SubmitTrailField | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      success: false,
      error: "Kontrollo fushat e shënuara.",
      fieldErrors,
    };
  }

  // Only a region already used by a published trail (what the /trails filter
  // lists), or "Tjetër" with typed text — so approved trails show up under
  // the filter instead of a near-duplicate spelling.
  let region: string;
  if (input.data.region === OTHER_REGION) {
    region = input.data.regionOther ?? "";
  } else {
    const regions = await getTrailRegions();
    if (!regions.includes(input.data.region)) {
      return {
        success: false,
        error: "Kontrollo fushat e shënuara.",
        fieldErrors: { region: "Zgjidh një rajon nga lista." },
      };
    }
    region = input.data.region;
  }
  const { name, city, difficulty, description } = input.data;

  if (!isGpxStorageConfigured()) {
    return {
      success: false,
      error: "Ruajtja e skedarëve nuk është konfiguruar.",
    };
  }

  let parsed;
  try {
    parsed = await parseGpxString(data.gpxContent);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GPX i pavlefshëm.";
    return { success: false, error: message, fieldErrors: { gpx: message } };
  }

  const slug = `${generateSlug(name)}-${crypto.randomUUID().slice(0, 6)}`;
  const trailId = crypto.randomUUID();

  // Storage upload first — an orphaned file on DB failure is fine;
  // a DB row pointing at a nonexistent URL is not.
  let gpxUrl: string;
  try {
    gpxUrl = await uploadGpx(`trails/${trailId}.gpx`, data.gpxContent);
  } catch (error) {
    captureError(error, {
      action: "submitTrail",
      extra: { phase: "storageUpload" },
    });
    return { success: false, error: "Ngarkimi i skedarit GPX dështoi." };
  }

  const gpxTrack = downsampleTrack(parsed.points);

  const [trail] = await db
    .insert(trails)
    .values({
      id: trailId,
      slug,
      name,
      description: description || null,
      region,
      city: city || null,
      difficulty,
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

  await notifySuperAdmins(name);

  revalidatePath("/trails");
  return { success: true, slug: trail.slug };
}

/** Tell every super admin a proposal is waiting. Best effort: the trail is
 * already saved, so a failure here is reported, not returned. */
async function notifySuperAdmins(trailName: string): Promise<void> {
  try {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "super_admin"), isNull(users.deletedAt)));
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: "trail.submitted",
          title: "Shteg i ri për shqyrtim",
          body: trailName,
          link: "/dashboard/admin?tab=trails",
        }),
      ),
    );
  } catch (error) {
    captureError(error, { action: "submitTrail", extra: { phase: "notify" } });
  }
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

  if (!isGpxStorageConfigured()) {
    return {
      success: false,
      error: "Ruajtja e skedarëve nuk është konfiguruar.",
    };
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
  if (!isGpxStorageConfigured()) {
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
