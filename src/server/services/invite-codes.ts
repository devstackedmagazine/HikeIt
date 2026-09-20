import { and, eq, gt, isNull, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { inviteCodes } from "@/lib/db/schema";
import { addMonths } from "@/lib/entitlements";

/**
 * Invite-code redemption.
 *
 * A code is redeemed exactly once, at club creation, and grants two things,
 * either of which may be absent:
 *
 * 1. **Free runway** — `trialMonths` of full Pro access, replacing the
 *    standard trial length. Applied locally, so it is worth something to a
 *    club the moment it signs up, whether or not it ever subscribes.
 * 2. **A Paddle discount** — `paddleDiscountId`, passed to checkout if and
 *    when the club does subscribe. Paddle owns the money math.
 *
 * Redemption never blocks club creation — an invalid code produces a warning
 * and the club is created on the standard free trial instead.
 */

/** Every way a redemption can fail. Callers map these to Albanian copy. */
export type InviteCodeError =
  | "not_found"
  | "inactive"
  | "expired"
  | "exhausted";

/** Albanian, user-facing. Postgres errors are never surfaced raw. */
export const inviteCodeErrorMessages: Record<InviteCodeError, string> = {
  not_found: "Kodi nuk është i vlefshëm",
  inactive: "Kodi nuk është i vlefshëm",
  expired: "Ky kod ka skaduar",
  exhausted: "Ky kod është shfrytëzuar plotësisht",
};

/** What a successfully redeemed code confers. */
export interface InviteCodeGrant {
  code: string;
  /** Months of Pro access granted from redemption. */
  trialMonths: number;
  /** When the granted trial ends. */
  trialEndsAt: Date;
  /** Paddle discount applied at checkout, or `null` if the code carries none. */
  paddleDiscountId: string | null;
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
      trialMonths: inviteCodes.trialMonths,
      paddleDiscountId: inviteCodes.paddleDiscountId,
    });

  const row = claimed[0];
  if (row) {
    return {
      ok: true,
      grant: {
        code: row.code,
        trialMonths: row.trialMonths,
        trialEndsAt: addMonths(now, row.trialMonths),
        paddleDiscountId: row.paddleDiscountId,
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
