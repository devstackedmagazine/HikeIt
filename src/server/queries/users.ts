import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import type { Organization, Trip, User } from "@/lib/db/schema";
import {
  accounts,
  organizationMembers,
  organizations,
  reviews,
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";
import { getPersonalTotals } from "@/server/queries/personal-stats";

export interface UserClub extends Organization {
  memberRole: "admin" | "organizer" | "member";
}

export interface UserProfile extends User {
  /** Hikes done — see `getPersonalTotals` for the counting rule. */
  hikesCount: number;
  clubsCount: number;
  reviewsCount: number;
  totalKmHiked: number;
  memberSince: Date;
  recentTrips: Trip[];
  clubs: UserClub[];
  /** Better Auth provider ids with a linked `accounts` row, e.g. `["credential", "google"]`. */
  linkedProviders: string[];
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return null;

  const [
    totals,
    clubsCount,
    reviewsCount,
    recentTrips,
    clubRows,
    linkedAccounts,
  ] = await Promise.all([
    getPersonalTotals(userId),
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
      .select({ trip: trips })
      .from(tripRegistrations)
      .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
      .where(
        and(
          eq(tripRegistrations.userId, userId),
          inArray(tripRegistrations.status, ["confirmed", "attended"]),
          eq(trips.status, "completed"),
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
    db
      .selectDistinct({ providerId: accounts.providerId })
      .from(accounts)
      .where(eq(accounts.userId, userId)),
  ]);

  return {
    ...user,
    hikesCount: totals.hikesCount,
    clubsCount: clubsCount[0]?.value ?? 0,
    reviewsCount: reviewsCount[0]?.value ?? 0,
    totalKmHiked: totals.totalKm,
    memberSince: user.createdAt,
    recentTrips: recentTrips.map((r) => r.trip),
    clubs: clubRows.map((r) => ({ ...r.org, memberRole: r.role })),
    linkedProviders: linkedAccounts.map((a) => a.providerId),
  };
}
