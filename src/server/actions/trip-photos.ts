"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOptionalSession } from "@/lib/auth/helpers";
import {
  canSetImageField,
  getOwnedImageUrls,
  releaseImage,
} from "@/lib/cloudinary/ownership";
import { db } from "@/lib/db";
import {
  organizationMembers,
  tripPhotos,
  tripRegistrations,
  trips,
} from "@/lib/db/schema";

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function isClubManager(
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

async function attendedTrip(userId: string, tripId: string): Promise<boolean> {
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

/** Set a trip's cover image (club manager only). */
export async function setTripCover(
  tripId: string,
  publicId: string | null,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    columns: { organizationId: true, slug: true, coverImageUrl: true },
  });
  if (!trip || !(await isClubManager(session.user.id, trip.organizationId))) {
    return { success: false, error: "Nuk keni qasje." };
  }
  if (!(await canSetImageField(session.user.id, publicId, trip.coverImageUrl))) {
    return { success: false, error: "Mund të përdorni vetëm foto që keni ngarkuar vetë." };
  }

  await db
    .update(trips)
    .set({ coverImageUrl: publicId })
    .where(eq(trips.id, tripId));
  revalidatePath(`/trips/${trip.slug}`);
  // Route pattern: this used the organization's UUID where the club slug
  // belongs, so it matched no page.
  revalidatePath("/dashboard/club/[slug]", "layout");
  return { success: true };
}

/** Attach uploaded photos to a trip. Managers anytime; hikers only when the
 * trip is completed and they attended. */
export async function addTripPhotos(
  tripId: string,
  publicIds: string[],
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };
  if (publicIds.length === 0) return { success: true };

  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) return { success: false, error: "Udhëtimi nuk u gjet." };

  const manager = await isClubManager(session.user.id, trip.organizationId);
  const hikerCanUpload =
    trip.status === "completed" &&
    (await attendedTrip(session.user.id, tripId));
  if (!manager && !hikerCanUpload) {
    return { success: false, error: "Nuk keni qasje për të shtuar foto." };
  }

  // Only images this user uploaded — never a publicId lifted from someone
  // else's photo.
  const urlByPublicId = await getOwnedImageUrls(session.user.id, publicIds);
  if (!urlByPublicId) {
    return { success: false, error: "Mund të shtoni vetëm foto që keni ngarkuar vetë." };
  }

  // Append after the photos already on the trip; photos now arrive one per
  // call, so a per-call index would give every photo sortOrder 0.
  const [last] = await db
    .select({ max: sql<number>`coalesce(max(${tripPhotos.sortOrder}), -1)` })
    .from(tripPhotos)
    .where(eq(tripPhotos.tripId, tripId));
  const base = Number(last?.max ?? -1) + 1;

  const values = publicIds.map((publicId, i) => ({
    tripId,
    userId: session.user.id,
    cloudinaryPublicId: publicId,
    url: urlByPublicId.get(publicId)!,
    sortOrder: base + i,
  }));

  await db.insert(tripPhotos).values(values);
  revalidatePath(`/trips/${trip.slug}`);
  revalidatePath("/dashboard/my-trips");
  return { success: true };
}

/** Delete a trip photo. Allowed for the photo owner or a club manager. */
export async function deleteTripPhoto(photoId: string): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const photo = await db.query.tripPhotos.findFirst({
    where: eq(tripPhotos.id, photoId),
  });
  if (!photo) return { success: false, error: "Nuk u gjet." };

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, photo.tripId),
    columns: { organizationId: true, slug: true },
  });
  if (!trip) return { success: false, error: "Udhëtimi nuk u gjet." };

  const owner = photo.userId === session.user.id;
  const manager = await isClubManager(session.user.id, trip.organizationId);
  if (!owner && !manager) {
    return { success: false, error: "Nuk keni qasje." };
  }

  await db.delete(tripPhotos).where(eq(tripPhotos.id, photoId));
  // Only destroys the asset if no other record still uses it.
  await releaseImage(photo.cloudinaryPublicId, session.user.id);
  revalidatePath(`/trips/${trip.slug}`);
  return { success: true };
}

/** Reorder a trip's photos (manager only). */
export async function reorderTripPhotos(
  tripId: string,
  orderedPhotoIds: string[],
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    columns: { organizationId: true, slug: true },
  });
  if (!trip || !(await isClubManager(session.user.id, trip.organizationId))) {
    return { success: false, error: "Nuk keni qasje." };
  }

  await Promise.all(
    orderedPhotoIds.map((id, index) =>
      db
        .update(tripPhotos)
        .set({ sortOrder: index })
        .where(and(eq(tripPhotos.id, id), eq(tripPhotos.tripId, tripId))),
    ),
  );
  revalidatePath(`/trips/${trip.slug}`);
  return { success: true };
}
