import { and, eq, inArray, isNull } from "drizzle-orm";

import type { ImageEntityType } from "@/lib/cloudinary/config";
import { db } from "@/lib/db";
import {
  organizationMembers,
  reviews,
  tripRegistrations,
  trips,
} from "@/lib/db/schema";

/**
 * Who may write images to which record. Shared by the photo server actions
 * and `/api/upload`, so the upload route can't accept a file the action that
 * attaches it would then refuse.
 */

/** Active admin or organizer of the club. */
export async function isClubManager(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const row = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, organizationId),
      eq(organizationMembers.userId, userId),
    ),
    columns: { role: true, leftAt: true },
  });
  if (!row || row.leftAt !== null) return false;
  return row.role === "admin" || row.role === "organizer";
}

export async function attendedTrip(
  userId: string,
  tripId: string,
): Promise<boolean> {
  // Accept "confirmed" as well as "attended": there is no attendance-marking
  // flow yet, so confirmed registrants of a completed trip may add memories.
  const reg = await db.query.tripRegistrations.findFirst({
    where: and(
      eq(tripRegistrations.tripId, tripId),
      eq(tripRegistrations.userId, userId),
      inArray(tripRegistrations.status, ["confirmed", "attended"]),
    ),
    columns: { id: true },
  });
  return Boolean(reg);
}

/** A user may add trail photos if they reviewed it or joined a trip on it. */
export async function eligibleForTrail(
  userId: string,
  trailId: string,
): Promise<boolean> {
  const review = await db.query.reviews.findFirst({
    where: and(eq(reviews.trailId, trailId), eq(reviews.userId, userId)),
    columns: { id: true },
  });
  if (review) return true;

  const reg = await db
    .select({ id: tripRegistrations.id })
    .from(tripRegistrations)
    .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
    .where(
      and(
        eq(tripRegistrations.userId, userId),
        eq(trips.trailId, trailId),
        inArray(tripRegistrations.status, ["confirmed", "attended"]),
      ),
    )
    .limit(1);
  return reg.length > 0;
}

/** Trip managers anytime; attendees once the trip is completed. */
export async function canAddTripPhotos(
  userId: string,
  tripId: string,
): Promise<boolean> {
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    columns: { organizationId: true, status: true },
  });
  if (!trip) return false;
  if (await isClubManager(userId, trip.organizationId)) return true;
  return trip.status === "completed" && (await attendedTrip(userId, tripId));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * May `userId` upload an image into `entityType`/`entityId`'s folder? Mirrors
 * the action that later attaches it: club images → club manager
 * (`setClubImages`), trip photos/cover → `addTripPhotos`/`setTripCover`,
 * trail photos → `addTrailPhotos`, avatar → only your own.
 */
export async function canUploadImage(
  userId: string,
  entityType: ImageEntityType,
  entityId: string,
): Promise<boolean> {
  // Every entity id is a UUID; anything else would also end up as a
  // Cloudinary folder name.
  if (!UUID.test(entityId)) return false;

  switch (entityType) {
    case "avatar":
      return entityId === userId;
    case "club": {
      const row = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, entityId),
          eq(organizationMembers.userId, userId),
          isNull(organizationMembers.leftAt),
          inArray(organizationMembers.role, ["admin", "organizer"]),
        ),
        columns: { id: true },
      });
      return Boolean(row);
    }
    case "trip":
      return canAddTripPhotos(userId, entityId);
    case "trail":
      return eligibleForTrail(userId, entityId);
  }
}
