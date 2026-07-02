import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { trailPhotos, tripPhotos, trips, users } from "@/lib/db/schema";

export interface PhotoWithUser {
  id: string;
  cloudinaryPublicId: string;
  caption: string | null;
  photographer: string | null;
}

/** Approved photos for a trip, ordered for display. */
export async function getTripPhotos(tripId: string): Promise<PhotoWithUser[]> {
  const rows = await db
    .select({
      id: tripPhotos.id,
      cloudinaryPublicId: tripPhotos.cloudinaryPublicId,
      caption: tripPhotos.caption,
      photographer: users.name,
      sortOrder: tripPhotos.sortOrder,
      createdAt: tripPhotos.createdAt,
    })
    .from(tripPhotos)
    .innerJoin(users, eq(users.id, tripPhotos.userId))
    .where(and(eq(tripPhotos.tripId, tripId), eq(tripPhotos.isApproved, true)))
    .orderBy(tripPhotos.sortOrder, desc(tripPhotos.createdAt));

  return rows.map((r) => ({
    id: r.id,
    cloudinaryPublicId: r.cloudinaryPublicId,
    caption: r.caption,
    photographer: r.photographer,
  }));
}

/** Latest photos across all of a club's trips (for the club portfolio). */
export async function getClubPhotos(
  organizationId: string,
  limit = 12,
): Promise<PhotoWithUser[]> {
  const rows = await db
    .select({
      id: tripPhotos.id,
      cloudinaryPublicId: tripPhotos.cloudinaryPublicId,
      caption: tripPhotos.caption,
      photographer: users.name,
    })
    .from(tripPhotos)
    .innerJoin(trips, eq(trips.id, tripPhotos.tripId))
    .innerJoin(users, eq(users.id, tripPhotos.userId))
    .where(
      and(
        eq(trips.organizationId, organizationId),
        eq(tripPhotos.isApproved, true),
      ),
    )
    .orderBy(desc(tripPhotos.createdAt))
    .limit(limit);
  return rows;
}

/** Photos for a trail: direct trail uploads + photos from trips on this trail. */
export async function getTrailPhotos(
  trailId: string,
  limit = 24,
): Promise<PhotoWithUser[]> {
  const [direct, fromTrips] = await Promise.all([
    db
      .select({
        id: trailPhotos.id,
        cloudinaryPublicId: trailPhotos.cloudinaryPublicId,
        caption: trailPhotos.caption,
        photographer: users.name,
        createdAt: trailPhotos.createdAt,
      })
      .from(trailPhotos)
      .innerJoin(users, eq(users.id, trailPhotos.userId))
      .where(
        and(eq(trailPhotos.trailId, trailId), eq(trailPhotos.isApproved, true)),
      ),
    db
      .select({
        id: tripPhotos.id,
        cloudinaryPublicId: tripPhotos.cloudinaryPublicId,
        caption: tripPhotos.caption,
        photographer: users.name,
        createdAt: tripPhotos.createdAt,
      })
      .from(tripPhotos)
      .innerJoin(trips, eq(trips.id, tripPhotos.tripId))
      .innerJoin(users, eq(users.id, tripPhotos.userId))
      .where(
        and(eq(trips.trailId, trailId), eq(tripPhotos.isApproved, true)),
      ),
  ]);

  return [...direct, ...fromTrips]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      cloudinaryPublicId: r.cloudinaryPublicId,
      caption: r.caption,
      photographer: r.photographer,
    }));
}
