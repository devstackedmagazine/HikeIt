import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";

import { db } from "@/lib/db";
import type { Trip } from "@/lib/db/schema";
import {
  organizationMembers,
  reviews,
  trails,
  tripRegistrations,
  trips,
  users,
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

export interface AdminTripRow {
  trip: Trip;
  confirmedCount: number;
}

export interface RecentRegistration {
  id: string;
  userName: string | null;
  userAvatarUrl: string | null;
  tripTitle: string;
  registeredAt: Date;
}

export interface ClubDashboard {
  upcomingTrips: AdminTripRow[];
  recentRegistrations: RecentRegistration[];
}

/**
 * Club-admin dashboard data: the next handful of trips (any non-cancelled
 * status) with their confirmed-registration counts, plus the most recent
 * sign-ups across all of the club's trips.
 */
export async function getClubDashboard(
  organizationId: string,
): Promise<ClubDashboard> {
  const upcoming = await db
    .select()
    .from(trips)
    .where(
      and(
        eq(trips.organizationId, organizationId),
        isNull(trips.deletedAt),
        inArray(trips.status, ["open", "full", "draft"]),
        gte(trips.startDatetime, new Date()),
      ),
    )
    .orderBy(asc(trips.startDatetime))
    .limit(5);

  const tripIds = upcoming.map((t) => t.id);

  const [countRows, recent] = await Promise.all([
    tripIds.length > 0
      ? db
          .select({
            tripId: tripRegistrations.tripId,
            value: count(),
          })
          .from(tripRegistrations)
          .where(
            and(
              inArray(tripRegistrations.tripId, tripIds),
              eq(tripRegistrations.status, "confirmed"),
            ),
          )
          .groupBy(tripRegistrations.tripId)
      : Promise.resolve([]),
    db
      .select({
        id: tripRegistrations.id,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        tripTitle: trips.title,
        registeredAt: tripRegistrations.registeredAt,
      })
      .from(tripRegistrations)
      .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
      .innerJoin(users, eq(users.id, tripRegistrations.userId))
      .where(eq(trips.organizationId, organizationId))
      .orderBy(desc(tripRegistrations.registeredAt))
      .limit(5),
  ]);

  const countMap = new Map(countRows.map((r) => [r.tripId, Number(r.value)]));

  return {
    upcomingTrips: upcoming.map((trip) => ({
      trip,
      confirmedCount: countMap.get(trip.id) ?? 0,
    })),
    recentRegistrations: recent,
  };
}
