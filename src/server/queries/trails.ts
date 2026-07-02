import {
  and,
  arrayOverlaps,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  or,
  type SQL,
} from "drizzle-orm";

import { db } from "@/lib/db";
import type { Trail } from "@/lib/db/schema";
import { trails } from "@/lib/db/schema";

type Difficulty = Trail["difficulty"];

export interface GetTrailsParams {
  difficulty?: Difficulty[];
  region?: string;
  search?: string;
  features?: string[];
  season?: string[];
  page?: number;
  limit?: number;
}

export interface GetTrailsResult {
  trails: Trail[];
  total: number;
  hasMore: boolean;
}

function buildFilters({
  difficulty,
  region,
  search,
  features,
  season,
}: GetTrailsParams): SQL[] {
  const filters: SQL[] = [];

  if (difficulty && difficulty.length > 0) {
    filters.push(inArray(trails.difficulty, difficulty));
  }
  if (region) filters.push(eq(trails.region, region));

  if (search) {
    const term = `%${search}%`;
    const match = or(ilike(trails.name, term), ilike(trails.description, term));
    if (match) filters.push(match);
  }

  // Features are multi-select: match a trail that has ANY of the selected ones.
  if (features && features.length > 0) {
    filters.push(arrayOverlaps(trails.features, features));
  }

  // Season is multi-select too: a trail matches if its `seasons` overlap any.
  if (season && season.length > 0) {
    filters.push(arrayOverlaps(trails.seasons, season));
  }

  return filters;
}

/** Paginated, filtered list of trails plus the total matching count. */
export async function getTrails(
  params: GetTrailsParams = {},
): Promise<GetTrailsResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 12);
  const offset = (page - 1) * limit;

  const filters = buildFilters(params);
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(trails)
      .where(where)
      .orderBy(desc(trails.verified), asc(trails.name))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(trails).where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;

  return { trails: rows, total, hasMore: offset + rows.length < total };
}

/** Single trail by slug, or null if not found. */
export async function getTrailBySlug(slug: string): Promise<Trail | null> {
  const row = await db.query.trails.findFirst({
    where: eq(trails.slug, slug),
  });
  return row ?? null;
}

/** Verified trails in a region (used for "nearby trails"). */
export async function getTrailsByRegion(region: string): Promise<Trail[]> {
  return db
    .select()
    .from(trails)
    .where(and(eq(trails.region, region), eq(trails.verified, true)))
    .orderBy(asc(trails.name));
}

/** Distinct, non-null regions for the filter dropdown. */
export async function getTrailRegions(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ region: trails.region })
    .from(trails)
    .where(isNotNull(trails.region))
    .orderBy(asc(trails.region));

  return rows
    .map((r) => r.region)
    .filter((region): region is string => region !== null);
}

export interface TrailOption {
  id: string;
  name: string;
  difficulty: Trail["difficulty"];
  region: string | null;
}

/** Minimal trail list for the trip-creation trail picker. */
export async function getTrailOptions(): Promise<TrailOption[]> {
  return db
    .select({
      id: trails.id,
      name: trails.name,
      difficulty: trails.difficulty,
      region: trails.region,
    })
    .from(trails)
    .orderBy(asc(trails.name));
}

/** Verified trails for homepage/featured rails. */
export async function getFeaturedTrails(limit = 6): Promise<Trail[]> {
  return db
    .select()
    .from(trails)
    .where(eq(trails.verified, true))
    .orderBy(desc(trails.elevationGainM))
    .limit(limit);
}
