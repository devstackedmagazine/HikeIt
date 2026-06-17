import { and, asc, eq, gte, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import type { Trip } from "@/lib/db/schema";
import { trips } from "@/lib/db/schema";

/** Upcoming, open, non-deleted trips on a given trail (soonest first). */
export async function getUpcomingTripsByTrail(
  trailId: string,
  limit = 3,
): Promise<Trip[]> {
  return db
    .select()
    .from(trips)
    .where(
      and(
        eq(trips.trailId, trailId),
        eq(trips.status, "open"),
        isNull(trips.deletedAt),
        gte(trips.startDatetime, new Date()),
      ),
    )
    .orderBy(asc(trips.startDatetime))
    .limit(limit);
}

/** Upcoming, open, non-deleted trips for a club (soonest first). */
export async function getUpcomingTripsByClub(
  organizationId: string,
  limit = 6,
): Promise<Trip[]> {
  return db
    .select()
    .from(trips)
    .where(
      and(
        eq(trips.organizationId, organizationId),
        eq(trips.status, "open"),
        isNull(trips.deletedAt),
        gte(trips.startDatetime, new Date()),
      ),
    )
    .orderBy(asc(trips.startDatetime))
    .limit(limit);
}
