"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { hikes, tripRegistrations, trips } from "@/lib/db/schema";
import { analyzeHike } from "@/lib/gpx/hike";
import { GpxError, parseGpxString } from "@/lib/gpx/parser";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { captureError } from "@/lib/sentry";

export interface ActionResult {
  success: boolean;
  error?: string;
}

function revalidateHikePages() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hikes");
  revalidatePath("/dashboard/profile");
}

/**
 * Save a personal hike from a raw GPX. Everything is re-derived here from the
 * file — the confirmation screen's numbers are display-only.
 */
export async function createHike(data: {
  gpxContent: string;
  name: string;
  tripRegistrationId?: string | null;
}): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };
  const userId = session.user.id;

  const rateLimitError = await enforceRateLimit("ratelimit.hike.upload", {
    userId,
    ip: await getClientIp(),
  });
  if (rateLimitError) return { success: false, error: rateLimitError };

  let analysis;
  try {
    analysis = analyzeHike(await parseGpxString(data.gpxContent));
  } catch (error) {
    return {
      success: false,
      error: error instanceof GpxError ? error.message : "GPX i pavlefshëm.",
    };
  }

  const name = data.name.trim().slice(0, 120) || analysis.name;

  // A linked registration must be the user's own, one that counts as a done
  // trip, and not already claimed by another hike. The unique index
  // backstops the last check against a race.
  let trailId: string | null = null;
  const tripRegistrationId = data.tripRegistrationId || null;
  if (tripRegistrationId) {
    const [reg] = await db
      .select({ trailId: trips.trailId, linked: hikes.id })
      .from(tripRegistrations)
      .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
      .leftJoin(hikes, eq(hikes.tripRegistrationId, tripRegistrations.id))
      .where(
        and(
          eq(tripRegistrations.id, tripRegistrationId),
          eq(tripRegistrations.userId, userId),
          inArray(tripRegistrations.status, ["confirmed", "attended"]),
          eq(trips.status, "completed"),
        ),
      )
      .limit(1);
    if (!reg) return { success: false, error: "Udhëtimi i zgjedhur nuk është i vlefshëm." };
    if (reg.linked) {
      return { success: false, error: "Ky udhëtim ka tashmë një ecje të lidhur." };
    }
    trailId = reg.trailId;
  }

  // Only the derived stats and the trimmed map line are stored. The GPX
  // itself is never persisted — it lives in memory for this request only.
  try {
    await db.insert(hikes).values({
      userId,
      name,
      hikedAt: analysis.hikedAt,
      distanceKm: String(analysis.distanceKm),
      elevationGainM: analysis.elevationGainM,
      durationMin: analysis.durationMin,
      gpxTrack: analysis.track,
      trailId,
      tripRegistrationId,
    });
  } catch (error) {
    // Drizzle wraps the driver error, so the constraint name may only be on
    // `cause`.
    const unique = [error, (error as { cause?: unknown })?.cause].some(
      (e) =>
        e instanceof Error &&
        e.message.includes("hikes_trip_registration_unique"),
    );
    if (unique) {
      return { success: false, error: "Ky udhëtim ka tashmë një ecje të lidhur." };
    }
    captureError(error, { action: "createHike", extra: { phase: "insert" } });
    return { success: false, error: "Diçka shkoi keq." };
  }

  revalidateHikePages();
  return { success: true };
}

/** Delete a hike permanently. Database-only — there is no stored file. */
export async function deleteHike(hikeId: string): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const deleted = await db
    .delete(hikes)
    .where(and(eq(hikes.id, hikeId), eq(hikes.userId, session.user.id)))
    .returning({ id: hikes.id });
  if (deleted.length === 0) return { success: false, error: "Ecja nuk u gjet." };

  revalidateHikePages();
  return { success: true };
}
