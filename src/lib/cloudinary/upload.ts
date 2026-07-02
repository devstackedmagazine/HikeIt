import type { UploadApiResponse } from "cloudinary";
import { eq } from "drizzle-orm";

import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary/client";
import {
  ALLOWED_FORMATS,
  CLOUDINARY_FOLDERS,
  type ImageEntityType,
} from "@/lib/cloudinary/config";
import { checkUploadRateLimit } from "@/lib/cloudinary/rate-limit";
import {
  generateSafeKey,
  hashFileContent,
  validateImageFile,
} from "@/lib/cloudinary/validation";
import { db } from "@/lib/db";
import { auditLogs, imageHashes } from "@/lib/db/schema";

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  isDuplicate: boolean;
}

export interface UploadOptions {
  entityType: ImageEntityType;
  entityId: string;
  userId: string;
  index?: number;
}

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  options: UploadOptions,
): Promise<UploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Ngarkimi i fotove nuk është konfiguruar.");
  }

  // 1. Rate limit.
  const rateLimit = await checkUploadRateLimit(options.userId);
  if (!rateLimit.allowed) {
    throw new Error("Keni arritur limitin e ngarkimeve. Provoni pas 1 ore.");
  }

  // 2. Server-side security validation.
  const validation = validateImageFile(buffer, mimeType, originalName);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 3. SHA-256 deduplication.
  const hash = hashFileContent(buffer);
  const existing = await db.query.imageHashes.findFirst({
    where: eq(imageHashes.hash, hash),
  });
  if (existing) {
    return {
      publicId: existing.cloudinaryPublicId,
      url: existing.cloudinaryUrl,
      secureUrl: existing.cloudinaryUrl,
      width: 0,
      height: 0,
      format: "unknown",
      bytes: buffer.length,
      isDuplicate: true,
    };
  }

  // 4. Safe key + folder isolation.
  const folder = CLOUDINARY_FOLDERS[options.entityType](options.entityId);
  const publicId = `${folder}/${generateSafeKey(options.entityId, options.index ?? 0)}`;

  // 5. Upload (EXIF stripped, smart quality/format, image-only, format allowlist).
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        transformation: [
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
        // EXIF/metadata is dropped by default on transformed delivery; force it.
        image_metadata: false,
        tags: ["hikeit", options.entityType, options.entityId],
        overwrite: false,
        allowed_formats: [...ALLOWED_FORMATS],
      },
      (error, uploaded) => {
        if (error) reject(error);
        else if (uploaded) resolve(uploaded);
        else reject(new Error("Upload failed"));
      },
    );
    stream.end(buffer);
  });

  // 6. Persist hash for dedup.
  await db.insert(imageHashes).values({
    hash,
    cloudinaryPublicId: result.public_id,
    cloudinaryUrl: result.secure_url,
    uploadedBy: options.userId,
    entityType: options.entityType,
    entityId: options.entityId,
  });

  // 7. Audit log (also powers the rate limiter).
  await db.insert(auditLogs).values({
    userId: options.userId,
    action: "image.upload",
    entityType: options.entityType,
    entityId: options.entityId,
    metadata: {
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    },
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
    isDuplicate: false,
  };
}

export async function deleteImage(
  publicId: string,
  userId: string,
): Promise<void> {
  if (!isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  await db
    .delete(imageHashes)
    .where(eq(imageHashes.cloudinaryPublicId, publicId));
  await db.insert(auditLogs).values({
    userId,
    action: "image.delete",
    entityType: "image",
    metadata: { publicId },
  });
}
