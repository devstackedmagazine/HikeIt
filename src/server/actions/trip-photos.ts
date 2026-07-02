"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOptionalSession } from "@/lib/auth/helpers";
import { deleteImage } from "@/lib/cloudinary/upload";
import { db } from "@/lib/db";
import {
  imageHashes,
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
    columns: { organizationId: true, slug: true },
  });
  if (!trip || !(await isClubManager(session.user.id, trip.organizationId))) {
    return { success: false, error: "Nuk keni qasje." };
  }

  await db
    .update(trips)
    .set({ coverImageUrl: publicId })
    .where(eq(trips.id, tripId));
  revalidatePath(`/trips/${trip.slug}`);
  revalidatePath(`/dashboard/club/${trip.organizationId}`);
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

  const hashes = await db
    .select({
      publicId: imageHashes.cloudinaryPublicId,
      url: imageHashes.cloudinaryUrl,
    })
    .from(imageHashes)
    .where(inArray(imageHashes.cloudinaryPublicId, publicIds));
  const urlByPublicId = new Map(hashes.map((h) => [h.publicId, h.url]));

  const values = publicIds.map((publicId, i) => ({
    tripId,
    userId: session.user.id,
    cloudinaryPublicId: publicId,
    url: urlByPublicId.get(publicId) ?? "",
    sortOrder: i,
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
  await deleteImage(photo.cloudinaryPublicId, session.user.id);
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
