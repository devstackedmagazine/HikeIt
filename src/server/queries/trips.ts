import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNull,
  lte,
  ne,
  type SQL,
  sql,
} from "drizzle-orm";

import { db } from "@/lib/db";
import type { Trail, Trip, TripRegistration } from "@/lib/db/schema";
import {
  organizations,
  trails,
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";

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

export interface ClubLite {
  name: string;
  slug: string;
  city: string | null;
  logoUrl: string | null;
}

export interface TripWithClub extends Trip {
  club: ClubLite;
  confirmedCount: number;
}

const confirmedCountSql = sql<number>`(
  select count(*) from trip_registrations tr
  where tr.trip_id = ${trips.id} and tr.status = 'confirmed'
)`;

function dateRangeUpperBound(range?: "week" | "month" | "quarter"): Date | null {
  if (!range) return null;
  const now = new Date();
  const days = range === "week" ? 7 : range === "month" ? 30 : 90;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export interface GetPublicTripsParams {
  difficulty?: Trip["difficulty"];
  clubSlug?: string;
  region?: string;
  dateRange?: "week" | "month" | "quarter";
  freeOnly?: boolean;
  page?: number;
  limit?: number;
}

/** Upcoming public (open) trips with club info + confirmed counts. */
export async function getPublicTrips(
  params: GetPublicTripsParams = {},
): Promise<{ trips: TripWithClub[]; total: number }> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 12);
  const offset = (page - 1) * limit;

  const filters: SQL[] = [
    eq(trips.status, "open"),
    isNull(trips.deletedAt),
    gte(trips.startDatetime, new Date()),
  ];
  if (params.difficulty) filters.push(eq(trips.difficulty, params.difficulty));
  if (params.clubSlug) filters.push(eq(organizations.slug, params.clubSlug));
  if (params.region) filters.push(eq(trails.region, params.region));
  if (params.freeOnly) filters.push(eq(trips.priceEur, "0"));
  const upper = dateRangeUpperBound(params.dateRange);
  if (upper) filters.push(lte(trips.startDatetime, upper));

  const where = and(...filters);

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        trip: trips,
        clubName: organizations.name,
        clubSlug: organizations.slug,
        clubCity: organizations.city,
        clubLogo: organizations.logoUrl,
        confirmedCount: confirmedCountSql,
      })
      .from(trips)
      .innerJoin(organizations, eq(organizations.id, trips.organizationId))
      .leftJoin(trails, eq(trails.id, trips.trailId))
      .where(where)
      .orderBy(asc(trips.startDatetime))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(trips)
      .innerJoin(organizations, eq(organizations.id, trips.organizationId))
      .leftJoin(trails, eq(trails.id, trips.trailId))
      .where(where),
  ]);

  return {
    trips: rows.map((r) => ({
      ...r.trip,
      confirmedCount: Number(r.confirmedCount),
      club: {
        name: r.clubName,
        slug: r.clubSlug,
        city: r.clubCity,
        logoUrl: r.clubLogo,
      },
    })),
    total: totalResult[0]?.value ?? 0,
  };
}

export interface TripWithDetails extends Trip {
  club: ClubLite & { id: string };
  trail: Trail | null;
  confirmedCount: number;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Single trip by slug (or uuid) with club + trail + confirmed count. */
export async function getTripById(
  identifier: string,
): Promise<TripWithDetails | null> {
  const rows = await db
    .select({
      trip: trips,
      clubId: organizations.id,
      clubName: organizations.name,
      clubSlug: organizations.slug,
      clubCity: organizations.city,
      clubLogo: organizations.logoUrl,
      trail: trails,
      confirmedCount: confirmedCountSql,
    })
    .from(trips)
    .innerJoin(organizations, eq(organizations.id, trips.organizationId))
    .leftJoin(trails, eq(trails.id, trips.trailId))
    .where(
      UUID_RE.test(identifier)
        ? eq(trips.id, identifier)
        : eq(trips.slug, identifier),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    ...row.trip,
    confirmedCount: Number(row.confirmedCount),
    trail: row.trail,
    club: {
      id: row.clubId,
      name: row.clubName,
      slug: row.clubSlug,
      city: row.clubCity,
      logoUrl: row.clubLogo,
    },
  };
}

export interface GetClubTripsParams {
  status?: Trip["status"];
  page?: number;
  limit?: number;
}

/** All trips for a club (admin view), optionally filtered by status. */
export async function getClubTrips(
  organizationId: string,
  { status, page = 1, limit = 10 }: GetClubTripsParams = {},
): Promise<{ trips: Trip[]; total: number }> {
  const offset = (Math.max(1, page) - 1) * limit;
  const filters: SQL[] = [
    eq(trips.organizationId, organizationId),
    isNull(trips.deletedAt),
  ];
  if (status) filters.push(eq(trips.status, status));
  const where = and(...filters);

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(trips)
      .where(where)
      .orderBy(desc(trips.startDatetime))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(trips).where(where),
  ]);

  return { trips: rows, total: totalResult[0]?.value ?? 0 };
}

export interface RegistrationWithUser {
  id: string;
  status: TripRegistration["status"];
  paymentStatus: TripRegistration["paymentStatus"];
  amountPaidEur: string | null;
  registeredAt: Date;
  userName: string | null;
  userEmail: string;
  userAvatarUrl: string | null;
}

/** All registrations for a trip (admin view), joined with the user. */
export async function getTripRegistrations(
  tripId: string,
): Promise<RegistrationWithUser[]> {
  return db
    .select({
      id: tripRegistrations.id,
      status: tripRegistrations.status,
      paymentStatus: tripRegistrations.paymentStatus,
      amountPaidEur: tripRegistrations.amountPaidEur,
      registeredAt: tripRegistrations.registeredAt,
      userName: users.name,
      userEmail: users.email,
      userAvatarUrl: users.avatarUrl,
    })
    .from(tripRegistrations)
    .innerJoin(users, eq(users.id, tripRegistrations.userId))
    .where(eq(tripRegistrations.tripId, tripId))
    .orderBy(desc(tripRegistrations.registeredAt));
}

/** Whether a user already has an active registration for a trip. */
export async function getUserRegistration(
  tripId: string,
  userId: string,
): Promise<TripRegistration | null> {
  // A user can have at most one *active* (non-canceled) registration per trip
  // — enforced by a partial unique index — plus any number of old canceled
  // rows kept for history. The active one (if any) is what the trip page
  // cares about; fall back to the most recently canceled row otherwise.
  const active = await db.query.tripRegistrations.findFirst({
    where: and(
      eq(tripRegistrations.tripId, tripId),
      eq(tripRegistrations.userId, userId),
      ne(tripRegistrations.status, "canceled"),
    ),
    orderBy: (t, { desc }) => [desc(t.registeredAt)],
  });
  if (active) return active;

  const canceled = await db.query.tripRegistrations.findFirst({
    where: and(
      eq(tripRegistrations.tripId, tripId),
      eq(tripRegistrations.userId, userId),
      eq(tripRegistrations.status, "canceled"),
    ),
    orderBy: (t, { desc }) => [desc(t.canceledAt)],
  });
  return canceled ?? null;
}

export type TimeFilter = "upcoming" | "past" | "waitlisted";

export interface RegisteredTrip {
  trip: Trip;
  club: ClubLite;
  registrationId: string;
  registrationStatus: TripRegistration["status"];
}

/** A hiker's registrations grouped by time/status, with trip + club. */
export async function getUserRegistrations(
  userId: string,
  when: TimeFilter,
): Promise<RegisteredTrip[]> {
  const now = new Date();
  const filters: SQL[] = [eq(tripRegistrations.userId, userId)];

  if (when === "waitlisted") {
    filters.push(eq(tripRegistrations.status, "waitlisted"));
  } else {
    filters.push(eq(tripRegistrations.status, "confirmed"));
    filters.push(
      when === "upcoming"
        ? gte(trips.startDatetime, now)
        : lte(trips.startDatetime, now),
    );
  }

  const rows = await db
    .select({
      trip: trips,
      registrationId: tripRegistrations.id,
      registrationStatus: tripRegistrations.status,
      clubName: organizations.name,
      clubSlug: organizations.slug,
      clubCity: organizations.city,
      clubLogo: organizations.logoUrl,
    })
    .from(tripRegistrations)
    .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
    .innerJoin(organizations, eq(organizations.id, trips.organizationId))
    .where(and(...filters))
    .orderBy(
      when === "past" ? desc(trips.startDatetime) : asc(trips.startDatetime),
    );

  return rows.map((r) => ({
    trip: r.trip,
    registrationId: r.registrationId,
    registrationStatus: r.registrationStatus,
    club: {
      name: r.clubName,
      slug: r.clubSlug,
      city: r.clubCity,
      logoUrl: r.clubLogo,
    },
  }));
}
