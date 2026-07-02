import { and, eq, gte, ilike, isNull, or, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { organizations, trails, trips } from "@/lib/db/schema";
import {
  difficultyLabels,
  tripStatusLabels,
} from "@/lib/i18n/labels";

export interface SearchResult {
  type: "trail" | "club" | "trip";
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  metadata: Record<string, string>;
}

export interface GlobalSearchResult {
  trails: SearchResult[];
  clubs: SearchResult[];
  trips: SearchResult[];
  total: number;
}

const EMPTY: GlobalSearchResult = {
  trails: [],
  clubs: [],
  trips: [],
  total: 0,
};

/** Case-insensitive search across trails, clubs and open trips. */
export async function globalSearch(
  query: string,
  limit = 5,
): Promise<GlobalSearchResult> {
  const q = query.trim();
  if (q.length < 2) return EMPTY;
  const term = `%${q}%`;

  const trailMatch = or(
    ilike(trails.name, term),
    ilike(trails.description, term),
    ilike(trails.region, term),
    ilike(trails.city, term),
  );
  const clubMatch = or(
    ilike(organizations.name, term),
    ilike(organizations.description, term),
    ilike(organizations.city, term),
  );
  const tripMatch = or(ilike(trips.title, term), ilike(trips.description, term));

  const tripFilters: SQL[] = [
    eq(trips.status, "open"),
    isNull(trips.deletedAt),
    gte(trips.startDatetime, new Date()),
  ];
  if (tripMatch) tripFilters.push(tripMatch);

  const [trailRows, clubRows, tripRows] = await Promise.all([
    db
      .select()
      .from(trails)
      .where(trailMatch)
      .limit(limit),
    db
      .select()
      .from(organizations)
      .where(and(clubMatch, isNull(organizations.deletedAt)))
      .limit(limit),
    db
      .select()
      .from(trips)
      .where(and(...tripFilters))
      .limit(limit),
  ]);

  const trailResults: SearchResult[] = trailRows.map((t) => ({
    type: "trail",
    id: t.id,
    slug: t.slug,
    title: t.name,
    subtitle: [t.region, t.city].filter(Boolean).join(" · ") || "Shteg",
    metadata: { difficulty: difficultyLabels[t.difficulty] ?? t.difficulty },
  }));

  const clubResults: SearchResult[] = clubRows.map((c) => ({
    type: "club",
    id: c.id,
    slug: c.slug,
    title: c.name,
    subtitle: c.city ?? "Klub",
    metadata: {},
  }));

  const tripResults: SearchResult[] = tripRows.map((t) => ({
    type: "trip",
    id: t.id,
    slug: t.slug,
    title: t.title,
    subtitle: tripStatusLabels[t.status] ?? "Udhëtim",
    metadata: {},
  }));

  return {
    trails: trailResults,
    clubs: clubResults,
    trips: tripResults,
    total: trailResults.length + clubResults.length + tripResults.length,
  };
}
