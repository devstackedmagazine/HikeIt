import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env } from "@/config/env";

/**
 * Trail and trip GPX files in Supabase Storage, through its S3-compatible API.
 * The bucket is public by design — these routes are published for anyone to
 * download. (Personal hikes never store a file; see `src/lib/gpx/hike.ts`.)
 *
 * The client is created lazily so the app boots without storage configured;
 * callers check `isGpxStorageConfigured` first and fail loudly.
 *
 * The S3 keys have full access to every bucket in the project and bypass RLS,
 * so this module is server-only and none of its env vars are NEXT_PUBLIC_.
 */
let client: S3Client | null = null;

export function isGpxStorageConfigured(): boolean {
  return Boolean(
    env.SUPABASE_STORAGE_S3_ENDPOINT &&
      env.SUPABASE_STORAGE_REGION &&
      env.SUPABASE_STORAGE_ACCESS_KEY_ID &&
      env.SUPABASE_STORAGE_SECRET_ACCESS_KEY &&
      env.SUPABASE_STORAGE_GPX_BUCKET &&
      env.SUPABASE_STORAGE_PUBLIC_URL,
  );
}

function getClient(): S3Client {
  if (!isGpxStorageConfigured()) {
    throw new Error(
      "GPX storage is not configured. Set the SUPABASE_STORAGE_* env vars.",
    );
  }
  client ??= new S3Client({
    region: env.SUPABASE_STORAGE_REGION!,
    endpoint: env.SUPABASE_STORAGE_S3_ENDPOINT!,
    // Supabase serves buckets as a path, not a subdomain.
    forcePathStyle: true,
    // Recent SDK versions add CRC32 checksum headers to every upload by
    // default; Supabase Storage doesn't support checksum headers. Only send
    // one when an operation strictly requires it.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: env.SUPABASE_STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: env.SUPABASE_STORAGE_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

/** Upload a GPX document (string) and return its public URL. */
export async function uploadGpx(key: string, content: string): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.SUPABASE_STORAGE_GPX_BUCKET,
      Key: key,
      Body: Buffer.from(content, "utf-8"),
      ContentType: "application/gpx+xml",
      // Re-uploads reuse the same key; don't let a CDN keep serving the old
      // file for long.
      CacheControl: "max-age=300",
    }),
  );
  return `${env.SUPABASE_STORAGE_PUBLIC_URL}/${env.SUPABASE_STORAGE_GPX_BUCKET}/${key}`;
}
