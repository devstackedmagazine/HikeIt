import { and, eq, inArray, sql } from "drizzle-orm";

import { deleteImage } from "@/lib/cloudinary/upload";
import { db } from "@/lib/db";
import { imageHashes } from "@/lib/db/schema";
import { captureError } from "@/lib/sentry";

/**
 * Who may attach an image, and when an image may be destroyed.
 *
 * Upload and attach are separate steps: /api/upload puts the file on
 * Cloudinary, then an action attaches the returned publicId to a record. The
 * publicId arrives from the client, so the attach step must never trust it —
 * it may only name an image the caller uploaded. `image_hashes` is the
 * ownership record (dedupe is per user, so every upload has one).
 */

/**
 * Delivery URLs for `publicIds`, or null if ANY of them wasn't uploaded by
 * `userId`. All-or-nothing: a batch with one foreign id is rejected whole.
 */
export async function getOwnedImageUrls(
  userId: string,
  publicIds: string[],
): Promise<Map<string, string> | null> {
  const unique = [...new Set(publicIds)];
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({
      publicId: imageHashes.cloudinaryPublicId,
      url: imageHashes.cloudinaryUrl,
    })
    .from(imageHashes)
    .where(
      and(
        eq(imageHashes.uploadedBy, userId),
        inArray(imageHashes.cloudinaryPublicId, unique),
      ),
    );
  const urls = new Map(rows.map((r) => [r.publicId, r.url]));
  return unique.every((id) => urls.has(id)) ? urls : null;
}

/**
 * For single-image fields edited by several people (trip cover, club logo and
 * cover): the new value is allowed if the caller uploaded it, or if it's what
 * the record already holds — so a co-admin re-saving settings without
 * touching the image isn't rejected for an image someone else uploaded.
 */
export async function canSetImageField(
  userId: string,
  next: string | null | undefined,
  current: string | null,
): Promise<boolean> {
  if (next == null || next === current) return true;
  return (await getOwnedImageUrls(userId, [next])) !== null;
}

/**
 * How many records still point at `publicId`, across every column that can
 * hold a Cloudinary image. Avatars store a full delivery URL, which always
 * ends in `/<publicId>`.
 *
 * Any new column that stores a Cloudinary image MUST be added here, or
 * deleting a record elsewhere can destroy the image it shows.
 */
async function countImageReferences(publicId: string): Promise<number> {
  const avatarSuffix = `/${publicId}`;
  const result = await db.execute<{ n: number }>(sql`
    select (
        (select count(*) from trip_photos     where cloudinary_public_id = ${publicId})
      + (select count(*) from trail_photos    where cloudinary_public_id = ${publicId})
      + (select count(*) from trips           where cover_image_url      = ${publicId})
      + (select count(*) from trails          where cover_image_url      = ${publicId})
      + (select count(*) from organizations   where logo_url = ${publicId} or cover_url = ${publicId})
      + (select count(*) from users
          where right(avatar_url, ${avatarSuffix.length}) = ${avatarSuffix})
    )::int as n
  `);
  return Number(result[0]?.n ?? 0);
}

/**
 * Call AFTER the record that used `publicId` has been removed or changed.
 * Destroys the Cloudinary asset (and its hash row) only when nothing else
 * references it. Dedupe hands a user their existing asset when they upload
 * the same file again, so one asset can back several of their records.
 *
 * Best-effort: a failure here leaves an unreferenced asset behind, which is
 * harmless, so it never fails the user's delete (it's reported to Sentry).
 */
export async function releaseImage(
  publicId: string | null | undefined,
  userId: string,
): Promise<void> {
  if (!publicId) return;
  try {
    if ((await countImageReferences(publicId)) > 0) return;
    await deleteImage(publicId, userId);
  } catch (error) {
    // Orphaned asset — acceptable, but worth knowing about.
    captureError(error, { action: "releaseImage", extra: { publicId } });
  }
}
