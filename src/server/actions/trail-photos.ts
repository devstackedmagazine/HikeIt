"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOptionalSession } from "@/lib/auth/helpers";
import { deleteImage } from "@/lib/cloudinary/upload";
import { db } from "@/lib/db";
import {
  imageHashes,
  reviews,
  trailPhotos,
  trails,
  tripRegistrations,
  trips,
} from "@/lib/db/schema";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** A user may add trail photos if they reviewed it or joined a trip on it. */
async function eligibleForTrail(
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

export async function addTrailPhotos(
  trailId: string,
  publicIds: string[],
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };
  if (publicIds.length === 0) return { success: true };

  const trail = await db.query.trails.findFirst({
    where: eq(trails.id, trailId),
    columns: { slug: true },
  });
  if (!trail) return { success: false, error: "Shtegu nuk u gjet." };

  if (!(await eligibleForTrail(session.user.id, trailId))) {
    return {
      success: false,
      error: "Duhet të keni marrë pjesë ose vlerësuar këtë shteg.",
    };
  }

  const hashes = await db
    .select({
      publicId: imageHashes.cloudinaryPublicId,
      url: imageHashes.cloudinaryUrl,
    })
    .from(imageHashes)
    .where(inArray(imageHashes.cloudinaryPublicId, publicIds));
  const urlByPublicId = new Map(hashes.map((h) => [h.publicId, h.url]));

  await db.insert(trailPhotos).values(
    publicIds.map((publicId) => ({
      trailId,
      userId: session.user.id,
      cloudinaryPublicId: publicId,
      url: urlByPublicId.get(publicId) ?? "",
    })),
  );

  revalidatePath(`/trails/${trail.slug}`);
  return { success: true };
}

export async function deleteTrailPhoto(photoId: string): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const photo = await db.query.trailPhotos.findFirst({
    where: eq(trailPhotos.id, photoId),
  });
  if (!photo) return { success: false, error: "Nuk u gjet." };
  if (photo.userId !== session.user.id) {
    return { success: false, error: "Nuk keni qasje." };
  }

  await db.delete(trailPhotos).where(eq(trailPhotos.id, photoId));
  await deleteImage(photo.cloudinaryPublicId, session.user.id);
  return { success: true };
}
