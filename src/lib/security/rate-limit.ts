import { and, count, eq, gte } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

/**
 * Generic rolling-window rate limiter for server actions, built on the same
 * `audit_logs` pattern as the image-upload limiter: every attempt is written
 * as an audit row, and the limit is a count of rows for that action in the
 * window. No extra table, and the attempts stay visible for incident review.
 *
 * Attempts are counted, not successes — the row is written *before* the guarded
 * work runs, so a caller hammering an endpoint that always fails is still
 * throttled.
 *
 * Note this is a rolling *count* window, not a token bucket: N attempts are
 * allowed in any trailing `windowMs`, which is what the brute-force and abuse
 * cases here need.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** Per-action limits. Keys double as the `audit_logs.action` value. */
export const RATE_LIMITS = {
  "ratelimit.trip.register": { max: 5, windowMs: 60 * 60 * 1000 },
  "ratelimit.stripe.connect_account": { max: 3, windowMs: 60 * 60 * 1000 },
  "ratelimit.stripe.onboarding_link": { max: 10, windowMs: 60 * 60 * 1000 },
  "ratelimit.profile.change_password": { max: 5, windowMs: 60 * 60 * 1000 },
  "ratelimit.profile.delete_account": { max: 5, windowMs: 60 * 60 * 1000 },
  "ratelimit.billing.checkout": { max: 10, windowMs: 60 * 60 * 1000 },
  "ratelimit.waitlist.join": { max: 5, windowMs: 60 * 60 * 1000 },
  // Super-admin mutations. The role is already trusted and the routes are
  // 404'd for everyone else, so these are abuse insurance (and a compromised
  // super-admin session's blast radius), not a workflow constraint.
  "ratelimit.admin.commission": { max: 20, windowMs: 60 * 60 * 1000 },
  "ratelimit.admin.invite_code": { max: 20, windowMs: 60 * 60 * 1000 },
  "ratelimit.favorite.toggle": { max: 60, windowMs: 60 * 60 * 1000 },
} as const;

export type RateLimitedAction = keyof typeof RATE_LIMITS;

/** Albanian message shown when a limit is hit. */
export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Keni bërë shumë përpjekje. Provoni sërish pas ${minutes} minutash.`;
}

/**
 * Best-effort client IP from the proxy headers Vercel sets. Returns null when
 * no header is present (e.g. local dev), in which case IP-keyed limits are
 * skipped rather than collapsing every caller onto one shared bucket.
 */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() ?? null;
}

/**
 * Check and consume one attempt against `action`'s limit.
 *
 * Exactly one of `userId` / `ip` identifies the caller. An unidentifiable
 * caller (no session and no IP header) is allowed through — failing open keeps
 * local dev usable; the authenticated limits are the ones that actually matter.
 */
export async function checkRateLimit(
  action: RateLimitedAction,
  identity: { userId?: string | null; ip?: string | null },
): Promise<RateLimitResult> {
  const { max, windowMs } = RATE_LIMITS[action];
  const since = new Date(Date.now() - windowMs);
  const userId = identity.userId ?? null;
  const ip = identity.ip ?? null;

  // User-keyed limits count that user's rows; IP-keyed limits (unauthenticated
  // callers) count rows written against that IP. With neither, fail open.
  const scope = userId
    ? eq(auditLogs.userId, userId)
    : ip
      ? eq(auditLogs.ipAddress, ip)
      : null;

  if (!scope) {
    return { allowed: true, remaining: max, retryAfterSeconds: 0 };
  }

  const [row] = await db
    .select({ value: count() })
    .from(auditLogs)
    .where(
      and(eq(auditLogs.action, action), gte(auditLogs.createdAt, since), scope),
    );

  const attempts = row?.value ?? 0;
  if (attempts >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  // Record this attempt. Best-effort: a logging failure must not take down the
  // action it guards.
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      ipAddress: ip,
    });
  } catch {
    // Ignore — the guarded action proceeds.
  }

  return {
    allowed: true,
    remaining: Math.max(0, max - attempts - 1),
    retryAfterSeconds: 0,
  };
}

/**
 * Convenience wrapper: consume an attempt and return an error message when the
 * limit is hit, or null when the caller may proceed.
 */
export async function enforceRateLimit(
  action: RateLimitedAction,
  identity: { userId?: string | null; ip?: string | null },
): Promise<string | null> {
  const result = await checkRateLimit(action, identity);
  return result.allowed ? null : rateLimitMessage(result.retryAfterSeconds);
}
