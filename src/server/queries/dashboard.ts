import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  organizationMembers,
  reviews,
  trails,
  tripRegistrations,
  trips,
} from "@/lib/db/schema";

export interface HikerStats {
  tripsJoined: number;
  clubsJoined: number;
  trailsReviewed: number;
  totalKm: number;
}

/** Headline counters for the hiker dashboard. */
export async function getHikerStats(userId: string): Promise<HikerStats> {
  const [tripsJoined, clubsJoined, trailsReviewed, km] = await Promise.all([
    db
      .select({ value: count() })
      .from(tripRegistrations)
      .where(
        and(
          eq(tripRegistrations.userId, userId),
          inArray(tripRegistrations.status, ["confirmed", "attended"]),
        ),
      ),
    db
      .select({ value: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          isNull(organizationMembers.leftAt),
        ),
      ),
    db
      .select({ value: count() })
      .from(reviews)
      .where(eq(reviews.userId, userId)),
    db
      .select({
        value: sql<number>`coalesce(sum(${trails.distanceKm}), 0)`,
      })
      .from(tripRegistrations)
      .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
      .innerJoin(trails, eq(trails.id, trips.trailId))
      .where(
        and(
          eq(tripRegistrations.userId, userId),
          inArray(tripRegistrations.status, ["confirmed", "attended"]),
        ),
      ),
  ]);

  return {
    tripsJoined: tripsJoined[0]?.value ?? 0,
    clubsJoined: clubsJoined[0]?.value ?? 0,
    trailsReviewed: trailsReviewed[0]?.value ?? 0,
    totalKm: Math.round(Number(km[0]?.value ?? 0)),
  };
}
