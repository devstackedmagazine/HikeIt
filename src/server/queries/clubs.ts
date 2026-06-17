import { and, asc, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import type { AuditLog, Organization } from "@/lib/db/schema";
import {
  auditLogs,
  organizationMembers,
  organizations,
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";

export interface ClubWithStats extends Organization {
  memberCount: number;
  upcomingTripsCount: number;
  completedTripsCount: number;
  owner: { name: string | null; avatarUrl: string | null } | null;
}

export interface GetClubsParams {
  search?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export interface GetClubsResult {
  clubs: ClubWithStats[];
  total: number;
}

// Correlated count subqueries — evaluated in the same statement, so no N+1.
const memberCountSql = sql<number>`(
  select count(*) from organization_members om
  where om.organization_id = ${organizations.id} and om.left_at is null
)`;

const upcomingTripsSql = sql<number>`(
  select count(*) from trips t
  where t.organization_id = ${organizations.id}
    and t.status = 'open' and t.deleted_at is null
    and t.start_datetime >= now()
)`;

const completedTripsSql = sql<number>`(
  select count(*) from trips t
  where t.organization_id = ${organizations.id}
    and t.status = 'completed' and t.deleted_at is null
)`;

function rowToClub(row: {
  org: Organization;
  memberCount: number;
  upcomingTripsCount: number;
  completedTripsCount: number;
  ownerName: string | null;
  ownerAvatarUrl: string | null;
}): ClubWithStats {
  return {
    ...row.org,
    memberCount: Number(row.memberCount),
    upcomingTripsCount: Number(row.upcomingTripsCount),
    completedTripsCount: Number(row.completedTripsCount),
    owner: row.org.ownerId
      ? { name: row.ownerName, avatarUrl: row.ownerAvatarUrl }
      : null,
  };
}

export async function getClubs(
  params: GetClubsParams = {},
): Promise<GetClubsResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 12);
  const offset = (page - 1) * limit;

  const filters = [isNull(organizations.deletedAt)];
  if (params.search) filters.push(ilike(organizations.name, `%${params.search}%`));
  if (params.city) filters.push(eq(organizations.city, params.city));
  const where = and(...filters);

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        org: organizations,
        memberCount: memberCountSql,
        upcomingTripsCount: upcomingTripsSql,
        completedTripsCount: completedTripsSql,
        ownerName: users.name,
        ownerAvatarUrl: users.avatarUrl,
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.ownerId, users.id))
      .where(where)
      .orderBy(asc(organizations.name))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(organizations).where(where),
  ]);

  return {
    clubs: rows.map(rowToClub),
    total: totalResult[0]?.value ?? 0,
  };
}

export async function getClubBySlug(
  slug: string,
): Promise<ClubWithStats | null> {
  const rows = await db
    .select({
      org: organizations,
      memberCount: memberCountSql,
      upcomingTripsCount: upcomingTripsSql,
      completedTripsCount: completedTripsSql,
      ownerName: users.name,
      ownerAvatarUrl: users.avatarUrl,
    })
    .from(organizations)
    .leftJoin(users, eq(organizations.ownerId, users.id))
    .where(and(eq(organizations.slug, slug), isNull(organizations.deletedAt)))
    .limit(1);

  const row = rows[0];
  return row ? rowToClub(row) : null;
}

export interface ClubStats {
  memberCount: number;
  membersThisMonth: number;
  activeTrips: number;
  completedTrips: number;
  revenue: number;
}

/** Aggregate stat counters for a club admin dashboard. */
export async function getClubStats(organizationId: string): Promise<ClubStats> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [members, monthMembers, active, completed, revenue] = await Promise.all(
    [
      db
        .select({ value: count() })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            isNull(organizationMembers.leftAt),
          ),
        ),
      db
        .select({ value: count() })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            isNull(organizationMembers.leftAt),
            sql`${organizationMembers.joinedAt} >= ${startOfMonth.toISOString()}`,
          ),
        ),
      db
        .select({ value: count() })
        .from(trips)
        .where(
          and(
            eq(trips.organizationId, organizationId),
            eq(trips.status, "open"),
            isNull(trips.deletedAt),
          ),
        ),
      db
        .select({ value: count() })
        .from(trips)
        .where(
          and(
            eq(trips.organizationId, organizationId),
            eq(trips.status, "completed"),
            isNull(trips.deletedAt),
          ),
        ),
      db
        .select({
          value: sql<number>`coalesce(sum(${tripRegistrations.amountPaidEur}), 0)`,
        })
        .from(tripRegistrations)
        .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
        .where(eq(trips.organizationId, organizationId)),
    ],
  );

  return {
    memberCount: members[0]?.value ?? 0,
    membersThisMonth: monthMembers[0]?.value ?? 0,
    activeTrips: active[0]?.value ?? 0,
    completedTrips: completed[0]?.value ?? 0,
    revenue: Number(revenue[0]?.value ?? 0),
  };
}

export interface MemberWithUser {
  membershipId: string;
  userId: string;
  role: "admin" | "organizer" | "member";
  joinedAt: Date;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface GetClubMembersParams {
  search?: string;
  page?: number;
  limit?: number;
}

/** Paginated, searchable members of a club. */
export async function getClubMembers(
  organizationId: string,
  { search, page = 1, limit = 20 }: GetClubMembersParams = {},
): Promise<{ members: MemberWithUser[]; total: number }> {
  const offset = (Math.max(1, page) - 1) * limit;
  const filters = [
    eq(organizationMembers.organizationId, organizationId),
    isNull(organizationMembers.leftAt),
  ];
  if (search) {
    const term = `%${search}%`;
    const match = or(ilike(users.name, term), ilike(users.email, term));
    if (match) filters.push(match);
  }
  const where = and(...filters);

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        membershipId: organizationMembers.id,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joinedAt,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(where)
      .orderBy(asc(users.name))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(where),
  ]);

  return { members: rows, total: totalResult[0]?.value ?? 0 };
}

/** Total collected revenue (sum of paid amounts) for a club. */
export async function getClubRevenue(organizationId: string): Promise<number> {
  const [row] = await db
    .select({
      value: sql<number>`coalesce(sum(${tripRegistrations.amountPaidEur}), 0)`,
    })
    .from(tripRegistrations)
    .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
    .where(eq(trips.organizationId, organizationId));
  return Number(row?.value ?? 0);
}

/** Recent audit-log activity for a club (trip + club events). */
export async function getClubActivity(
  organizationId: string,
  limit = 10,
): Promise<AuditLog[]> {
  return db
    .select()
    .from(auditLogs)
    .where(
      or(
        sql`${auditLogs.metadata}->>'organizationId' = ${organizationId}`,
        eq(auditLogs.entityId, organizationId),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
