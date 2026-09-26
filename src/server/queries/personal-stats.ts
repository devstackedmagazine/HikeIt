import { and, count, eq, inArray, notExists, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { hikes, trails, tripRegistrations, trips } from "@/lib/db/schema";

/**
 * The single definition of "hikes done" and "km hiked". Dashboard home and
 * the profile both read from here so the numbers can never disagree.
 *
 *   km    = Σ hikes.distance_km
 *         + Σ trail distance of completed trips where the user was
 *           confirmed/attended AND no hike is linked to that registration
 *   count = same rule, counting rows instead of summing distance.
 *
 * A hike linked to a registration REPLACES that trip's trail distance, so
 * nothing is counted twice. The unique index
 * `hikes_trip_registration_unique` guarantees at most one hike per
 * registration, so the hike side can't double up either.
 *
 * "Completed" is `trips.status = 'completed'` (set by the complete-trips cron):
 * a confirmed registration on an upcoming trip is not a hike yet.
 */

export interface PersonalTotals {
  hikesCount: number;
  totalKm: number;
}

/** Registrations that count as a done trip, excluding ones a hike replaces. */
export function countedRegistrationWhere(userId: string) {
  return and(
    eq(tripRegistrations.userId, userId),
    inArray(tripRegistrations.status, ["confirmed", "attended"]),
    eq(trips.status, "completed"),
    notExists(
      db
        .select({ one: sql`1` })
        .from(hikes)
        .where(eq(hikes.tripRegistrationId, tripRegistrations.id)),
    ),
  );
}

export async function getPersonalTotals(
  userId: string,
): Promise<PersonalTotals> {
  const [hikeRows, tripRows] = await Promise.all([
    db
      .select({
        n: count(),
        km: sql<string>`coalesce(sum(${hikes.distanceKm}), 0)`,
      })
      .from(hikes)
      .where(eq(hikes.userId, userId)),
    // Left join: a completed trip with no trail still counts as a trip, it
    // just contributes 0 km.
    db
      .select({
        n: count(),
        km: sql<string>`coalesce(sum(${trails.distanceKm}), 0)`,
      })
      .from(tripRegistrations)
      .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
      .leftJoin(trails, eq(trails.id, trips.trailId))
      .where(countedRegistrationWhere(userId)),
  ]);

  const hikesCount = (hikeRows[0]?.n ?? 0) + (tripRows[0]?.n ?? 0);
  const km = Number(hikeRows[0]?.km ?? 0) + Number(tripRows[0]?.km ?? 0);
  return { hikesCount, totalKm: Math.round(km) };
}
