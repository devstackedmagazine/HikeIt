import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { sanitizeGpx } from "../src/lib/gpx/sanitize";

/**
 * One-off: rewrite GPX files already in Supabase Storage through
 * `sanitizeGpx` — the same sanitizing new uploads get (no <time>,
 * <extensions>, <metadata> or creator; coordinates and elevation kept
 * verbatim, so stored stats and map lines stay valid).
 *
 *   pnpm gpx:sanitize                  dry run over trails/ (default)
 *   pnpm gpx:sanitize --prefix=trips/  dry run over trip GPX files
 *   pnpm gpx:sanitize --write          actually overwrite the files
 *
 * Reads only storage — never the database. Files already written by the app
 * (creator="HikeIt") are skipped. A backfilled file gets no track name, since
 * the trail title lives in the database. Env comes from the shell, else
 * `.env.local` (SUPABASE_STORAGE_*).
 */
async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const prefix =
    args.find((a) => a.startsWith("--prefix="))?.slice("--prefix=".length) ??
    "trails/";

  if (!process.env.SUPABASE_STORAGE_S3_ENDPOINT) {
    try {
      process.loadEnvFile(".env.local");
    } catch {
      // No .env.local — rely on the shell environment.
    }
  }
  const required = [
    "SUPABASE_STORAGE_S3_ENDPOINT",
    "SUPABASE_STORAGE_REGION",
    "SUPABASE_STORAGE_ACCESS_KEY_ID",
    "SUPABASE_STORAGE_SECRET_ACCESS_KEY",
    "SUPABASE_STORAGE_GPX_BUCKET",
  ] as const;
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  const bucket = process.env.SUPABASE_STORAGE_GPX_BUCKET!;

  const s3 = new S3Client({
    region: process.env.SUPABASE_STORAGE_REGION!,
    endpoint: process.env.SUPABASE_STORAGE_S3_ENDPOINT!,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: process.env.SUPABASE_STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY!,
    },
  });

  const keys: string[] = [];
  let token: string | undefined;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const obj of page.Contents ?? []) {
      if (obj.Key?.toLowerCase().endsWith(".gpx")) keys.push(obj.Key);
    }
    token = page.NextContinuationToken;
  } while (token);

  let changed = 0;
  let unchanged = 0;
  let failed = 0;
  for (const key of keys) {
    try {
      const res = await s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      const original = (await res.Body?.transformToString("utf-8")) ?? "";
      if (/<gpx[^>]*creator="HikeIt"/.test(original)) {
        unchanged++;
        console.log(`skip     ${key} (already sanitized)`);
        continue;
      }
      const clean = await sanitizeGpx(original);
      if (clean === original) {
        unchanged++;
        continue;
      }
      changed++;
      console.log(
        `${write ? "write" : "would  "} ${key} (${original.length} → ${clean.length} bytes)`,
      );
      if (write) {
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: Buffer.from(clean, "utf-8"),
            ContentType: "application/gpx+xml",
            CacheControl: "max-age=300",
          }),
        );
      }
    } catch (error) {
      failed++;
      console.error(
        `error    ${key}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  console.log(
    `\n${write ? "WRITE" : "DRY RUN"} ${bucket}/${prefix}: ${keys.length} files, ` +
      `${changed} ${write ? "rewritten" : "would change"}, ${unchanged} unchanged, ${failed} failed`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
