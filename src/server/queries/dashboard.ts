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
import { getPersonalTotals } from "@/server/queries/personal-stats";
import { displayStatusFilter } from "@/server/queries/trip-status-sql";

export interface HikerStats {
  /** Hikes done: logged hikes + completed trips no hike replaces. */
  hikesCount: number;
  clubsJoined: number;
  trailsReviewed: number;
  totalKm: number;
}

/** Headline counters for the hiker dashboard. */
export async function getHikerStats(userId: string): Promise<HikerStats> {
  const [totals, clubsJoined, trailsReviewed] = await Promise.all([
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
  ]);

  return {
    hikesCount: totals.hikesCount,
    clubsJoined: clubsJoined[0]?.value ?? 0,
    trailsReviewed: trailsReviewed[0]?.value ?? 0,
    totalKm: totals.totalKm,
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
  /** Shown as a LISTË PRITJE tag. */
  waitlisted: boolean;
  /** The person had canceled this trip before — shown as RI-REGJISTRIM, so
   * roster churn stays visible now that canceled rows are hidden. */
  isReregistration: boolean;
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
        status: tripRegistrations.status,
        isReregistration: tripRegistrations.isReregistration,
      })
      .from(tripRegistrations)
      .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
      .innerJoin(users, eq(users.id, tripRegistrations.userId))
      .where(
        and(
          eq(trips.organizationId, organizationId),
          // Live registrations only. A canceled row next to the same person's
          // re-registration read as a duplicate sign-up; the churn it hinted
          // at is carried by the RI-REGJISTRIM tag instead.
          inArray(tripRegistrations.status, [
            "confirmed",
            "attended",
            "waitlisted",
          ]),
        ),
      )
      .orderBy(desc(tripRegistrations.registeredAt))
      .limit(5),
  ]);

  const countMap = new Map(countRows.map((r) => [r.tripId, Number(r.value)]));

  return {
    upcomingTrips: upcoming.map((trip) => ({
      trip,
      confirmedCount: countMap.get(trip.id) ?? 0,
    })),
    recentRegistrations: recent.map(({ status, ...r }) => ({
      ...r,
      waitlisted: status === "waitlisted",
    })),
  };
}

export interface ClubTripAdminRow {
  trip: Trip;
  trailName: string | null;
  trailSlug: string | null;
  confirmedCount: number;
}

export interface ClubTripsAdminResult {
  rows: ClubTripAdminRow[];
  total: number;
}

/**
 * Paginated, optionally status-filtered trips for the club-admin management
 * table — each joined to its trail and with a confirmed-registration count.
 */
export async function getClubTripsAdmin(
  organizationId: string,
  params: { status?: Trip["status"]; page?: number; limit?: number } = {},
): Promise<ClubTripsAdminResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 10);
  const offset = (page - 1) * limit;

  const confirmedSql = sql<number>`(
    select count(*) from trip_registrations tr
    where tr.trip_id = ${trips.id} and tr.status = 'confirmed'
  )`;

  const where = and(
    eq(trips.organizationId, organizationId),
    isNull(trips.deletedAt),
    // Filter by the status the table shows (past open/full → completed).
    params.status ? displayStatusFilter(params.status) : undefined,
  );

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        trip: trips,
        trailName: trails.name,
        trailSlug: trails.slug,
        confirmedCount: confirmedSql,
      })
      .from(trips)
      .leftJoin(trails, eq(trails.id, trips.trailId))
      .where(where)
      .orderBy(desc(trips.startDatetime))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(trips).where(where),
  ]);

  return {
    rows: rows.map((r) => ({
      trip: r.trip,
      trailName: r.trailName,
      trailSlug: r.trailSlug,
      confirmedCount: Number(r.confirmedCount),
    })),
    total: totalResult[0]?.value ?? 0,
  };
}
