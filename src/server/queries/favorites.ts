import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import type { Trail, Trip } from "@/lib/db/schema";
import {
  organizations,
  trailFavorites,
  trails,
  tripFavorites,
  trips,
} from "@/lib/db/schema";

export async function isTrailFavorited(
  userId: string,
  trailId: string,
): Promise<boolean> {
  const row = await db.query.trailFavorites.findFirst({
    where: and(
      eq(trailFavorites.userId, userId),
      eq(trailFavorites.trailId, trailId),
    ),
    columns: { id: true },
  });
  return !!row;
}

export async function isTripFavorited(
  userId: string,
  tripId: string,
): Promise<boolean> {
  const row = await db.query.tripFavorites.findFirst({
    where: and(
      eq(tripFavorites.userId, userId),
      eq(tripFavorites.tripId, tripId),
    ),
    columns: { id: true },
  });
  return !!row;
}

export async function getUserFavoriteTrails(userId: string): Promise<Trail[]> {
  const rows = await db
    .select({ trail: trails })
    .from(trailFavorites)
    .innerJoin(trails, eq(trails.id, trailFavorites.trailId))
    .where(eq(trailFavorites.userId, userId))
    .orderBy(desc(trailFavorites.createdAt));

  return rows.map((r) => r.trail);
}

export interface FavoriteTrip {
  trip: Pick<
    Trip,
    "id" | "slug" | "title" | "startDatetime" | "status" | "priceEur"
  >;
  clubName: string;
}

export async function getUserFavoriteTrips(
  userId: string,
): Promise<FavoriteTrip[]> {
  const rows = await db
    .select({
      trip: {
        id: trips.id,
        slug: trips.slug,
        title: trips.title,
        startDatetime: trips.startDatetime,
        status: trips.status,
        priceEur: trips.priceEur,
      },
      clubName: organizations.name,
    })
    .from(tripFavorites)
    .innerJoin(trips, eq(trips.id, tripFavorites.tripId))
    .innerJoin(organizations, eq(organizations.id, trips.organizationId))
    .where(eq(tripFavorites.userId, userId))
    .orderBy(desc(tripFavorites.createdAt));

  return rows;
}
