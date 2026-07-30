import { and, eq, gt, isNull, or, sql } from "drizzle-orm";

import { addMonths, clampRate } from "@/lib/commission";
import { db } from "@/lib/db";
import { inviteCodes } from "@/lib/db/schema";

/**
 * Invite-code redemption.
 *
 * A code is redeemed exactly once, at club creation, and grants the club a
 * commission rate for `durationMonths` (or permanently). Redemption never
 * blocks club creation — an invalid code produces a warning and the club is
 * created on the standard free trial instead.
 */

/** Every way a redemption can fail. Callers map these to Albanian copy. */
export type InviteCodeError =
  | "not_found"
  | "inactive"
  | "expired"
  | "exhausted";

/** Albanian, user-facing. Stripe/Postgres errors are never surfaced raw. */
export const inviteCodeErrorMessages: Record<InviteCodeError, string> = {
  not_found: "Kodi nuk është i vlefshëm",
  inactive: "Kodi nuk është i vlefshëm",
  expired: "Ky kod ka skaduar",
  exhausted: "Ky kod është shfrytëzuar plotësisht",
};

/** The commission grant a successfully redeemed code confers. */
export interface InviteCodeGrant {
  code: string;
  rate: number;
  /** `null` when the code grants the rate permanently. */
  until: Date | null;
}

export type RedeemResult =
  | { ok: true; grant: InviteCodeGrant }
  | { ok: false; error: InviteCodeError };

/** Trim + uppercase, so codes compare case-insensitively. */
export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * Atomically claim one use of `rawCode`.
 *
 * The claim is a single conditional UPDATE — every redeemability condition
 * (active, unexpired, uses remaining) lives in the WHERE clause alongside the
 * increment. Two clubs redeeming the last use of a code concurrently therefore
 * cannot both succeed: Postgres serializes the row update, and the loser's
 * `used_count < max_uses` predicate no longer holds, so it matches no row.
 * A read-then-write would let both through.
 *
 * `tx` accepts a transaction handle so the caller can commit the claim
 * together with the club it applies to.
 */
export async function redeemInviteCode(
  rawCode: string,
  tx: Pick<typeof db, "update" | "query"> = db,
  now: Date = new Date(),
): Promise<RedeemResult> {
  const code = normalizeInviteCode(rawCode);
  if (!code) return { ok: false, error: "not_found" };

  const claimed = await tx
    .update(inviteCodes)
    .set({
      usedCount: sql`${inviteCodes.usedCount} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(inviteCodes.code, code),
        eq(inviteCodes.isActive, true),
        or(isNull(inviteCodes.expiresAt), gt(inviteCodes.expiresAt, now)),
        or(
          isNull(inviteCodes.maxUses),
          sql`${inviteCodes.usedCount} < ${inviteCodes.maxUses}`,
        ),
      ),
    )
    .returning({
      code: inviteCodes.code,
      commissionRate: inviteCodes.commissionRate,
      durationMonths: inviteCodes.durationMonths,
    });

  const row = claimed[0];
  if (row) {
    return {
      ok: true,
      grant: {
        code: row.code,
        rate: clampRate(Number(row.commissionRate)),
        until: row.durationMonths
          ? addMonths(now, row.durationMonths)
          : null,
      },
    };
  }

  // The claim matched nothing. Re-read the row to say *why* — this is only for
  // the error message, so a race here is harmless.
  const existing = await tx.query.inviteCodes.findFirst({
    where: eq(inviteCodes.code, code),
    columns: {
      isActive: true,
      expiresAt: true,
      maxUses: true,
      usedCount: true,
    },
  });

  if (!existing) return { ok: false, error: "not_found" };
  if (!existing.isActive) return { ok: false, error: "inactive" };
  if (existing.expiresAt && existing.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, error: "expired" };
  }
  return { ok: false, error: "exhausted" };
}
