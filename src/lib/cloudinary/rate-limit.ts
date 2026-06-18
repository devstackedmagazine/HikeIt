import { and, count, eq, gte } from "drizzle-orm";

import { MAX_UPLOADS_PER_HOUR } from "@/lib/cloudinary/config";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/** DB-based rolling rate limit: counts `image.upload` audit rows in the last hour. */
export async function checkUploadRateLimit(
  userId: string,
): Promise<RateLimitResult> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const resetAt = new Date(Date.now() + 60 * 60 * 1000);

  const [row] = await db
    .select({ value: count() })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.userId, userId),
        eq(auditLogs.action, "image.upload"),
        gte(auditLogs.createdAt, oneHourAgo),
      ),
    );

  const uploadCount = row?.value ?? 0;
  return {
    allowed: uploadCount < MAX_UPLOADS_PER_HOUR,
    remaining: Math.max(0, MAX_UPLOADS_PER_HOUR - uploadCount),
    resetAt,
  };
}
