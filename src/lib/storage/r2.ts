import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "@/config/env";

/**
 * Cloudflare R2 (S3-compatible) client, created lazily so the app boots without
 * storage configured. `isR2Configured` lets callers degrade gracefully.
 */
let client: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET_NAME &&
      env.R2_PUBLIC_URL,
  );
}

function getClient(): S3Client {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured. Set the R2_* env vars.");
  }
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

/** Upload a buffer to R2 and return its public URL. */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return `${env.R2_PUBLIC_URL}/${key}`;
}

/** Delete an object from R2. */
export async function deleteFile(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }),
  );
}
