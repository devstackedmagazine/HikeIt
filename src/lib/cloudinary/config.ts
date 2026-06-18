/** Allowlist of accepted image MIME types (never a blocklist). */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** File-signature magic bytes per type (HEIC/HEIF vary — Cloudinary validates). */
export const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/jpg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "image/heic": [],
  "image/heif": [],
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;
export const MAX_UPLOADS_PER_HOUR = 20;

export const MIN_DIMENSION = 100;
export const MAX_DIMENSION = 20000;

export const CLOUDINARY_FOLDERS = {
  trip: (id: string) => `hikeit/trips/${id}`,
  club: (id: string) => `hikeit/clubs/${id}`,
  trail: (id: string) => `hikeit/trails/${id}`,
  avatar: (id: string) => `hikeit/avatars/${id}`,
} as const;

export type ImageEntityType = keyof typeof CLOUDINARY_FOLDERS;

export const ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
] as const;
