import crypto from "node:crypto";

/**
 * Whether a cron request carries `Authorization: Bearer <CRON_SECRET>`.
 *
 * Compared in constant time: `!==` on strings stops at the first differing
 * character, which leaks how much of a guess was right. Both sides are hashed
 * first because `timingSafeEqual` needs equal lengths, and so the time taken
 * doesn't depend on the header's length either. No secret set → never
 * authorized.
 */
export function isCronAuthorized(
  authHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !authHeader) return false;
  const digest = (value: string) =>
    crypto.createHash("sha256").update(value).digest();
  return crypto.timingSafeEqual(digest(authHeader), digest(`Bearer ${secret}`));
}
