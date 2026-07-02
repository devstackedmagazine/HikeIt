import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import type { Organization, Trip, User } from "@/lib/db/schema";
import {
  organizationMembers,
  organizations,
  reviews,
  trails,
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";

export interface UserClub extends Organization {
  memberRole: "admin" | "organizer" | "member";
}

export interface UserProfile extends User {
  tripsCount: number;
  clubsCount: number;
  reviewsCount: number;
  totalKmHiked: number;
  memberSince: Date;
  recentTrips: Trip[];
  clubs: UserClub[];
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return null;

  const [tripsCount, clubsCount, reviewsCount, km, recentTrips, clubRows] =
    await Promise.all([
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
        .select({ value: sql<number>`coalesce(sum(${trails.distanceKm}), 0)` })
        .from(tripRegistrations)
        .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
        .innerJoin(trails, eq(trails.id, trips.trailId))
        .where(
          and(
            eq(tripRegistrations.userId, userId),
            inArray(tripRegistrations.status, ["confirmed", "attended"]),
          ),
        ),
      db
        .select({ trip: trips })
        .from(tripRegistrations)
        .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
        .where(
          and(
            eq(tripRegistrations.userId, userId),
            inArray(tripRegistrations.status, ["confirmed", "attended"]),
          ),
        )
        .orderBy(desc(trips.startDatetime))
        .limit(5),
      db
        .select({ org: organizations, role: organizationMembers.role })
        .from(organizationMembers)
        .innerJoin(
          organizations,
          eq(organizations.id, organizationMembers.organizationId),
        )
        .where(
          and(
            eq(organizationMembers.userId, userId),
            isNull(organizationMembers.leftAt),
          ),
        ),
    ]);

  return {
    ...user,
    tripsCount: tripsCount[0]?.value ?? 0,
    clubsCount: clubsCount[0]?.value ?? 0,
    reviewsCount: reviewsCount[0]?.value ?? 0,
    totalKmHiked: Math.round(Number(km[0]?.value ?? 0)),
    memberSince: user.createdAt,
    recentTrips: recentTrips.map((r) => r.trip),
    clubs: clubRows.map((r) => ({ ...r.org, memberRole: r.role })),
  };
}
