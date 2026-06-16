import { and, asc, count, eq, ilike, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import type { Organization } from "@/lib/db/schema";
import { organizations, users } from "@/lib/db/schema";

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
