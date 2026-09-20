/**
 * Entitlement resolution — the single source of truth for what a club can
 * access.
 *
 * Replaces the old `resolveCommission` module, which priced trip payments.
 * HikeIt no longer touches trip money; what a club pays for now is the
 * product itself, so the question this module answers changed from "what rate
 * do we charge on this payment" to "what tier is this club entitled to right
 * now".
 *
 * `subscriptionTier` remains the source of truth for *paid* access. The free
 * trial is an overlay in front of it: a club on `free` with `trialEndsAt` in
 * the future gets Pro. Deliberately resolved rather than written — a club's
 * tier is a pure function of its row, so a trial cannot get stuck granting
 * access nobody is paying for the way a downgrade cron could if it failed
 * silently.
 *
 * Pure by design — no DB, no I/O, no `Date.now()` except as a default
 * argument — so it can be reasoned about and unit-tested directly.
 */

/** Months of full Pro access every new club gets automatically. */
export const TRIAL_MONTHS = 3;

/** Days before a trial ends that we email the club owner. */
export const TRIAL_ENDING_NOTICE_DAYS = 7;

/** The tier a club is on while its free trial is running. */
export const TRIAL_TIER = "pro" as const;

/** Billing tiers, mirroring `subscriptionTierEnum`. */
export type EntitlementTier = "free" | "pro" | "team";

/** Which rule produced the resolved tier. */
export type EntitlementSource = "subscription" | "trial" | "free";

export interface ResolvedEntitlement {
  /** What the club may actually use right now. */
  tier: EntitlementTier;
  source: EntitlementSource;
  /** When this entitlement lapses. `null` = indefinitely. */
  endsAt: Date | null;
}

/**
 * The organization fields entitlement resolution depends on. A structural
 * subset of `Organization` rather than the row itself, so callers can `select`
 * just these two columns.
 */
export interface EntitlementOrganization {
  subscriptionTier: EntitlementTier;
  trialEndsAt: Date | null;
}

/**
 * Resolve what a club can access, in priority order:
 *
 * 1. **Paid subscription** — any tier above `free`. Highest priority: a club
 *    that is paying is never downgraded by a lapsed trial.
 * 2. **Free trial** — `trialEndsAt` in the future → Pro.
 * 3. **Free** — the standing free tier.
 *
 * A club whose trial lapses transitions to `free` silently: there is no state
 * to flip, the tier simply resolves differently once the timestamp is past.
 */
export function resolveEntitlement(
  org: EntitlementOrganization,
  now: Date = new Date(),
): ResolvedEntitlement {
  if (org.subscriptionTier !== "free") {
    return {
      tier: org.subscriptionTier,
      source: "subscription",
      endsAt: null,
    };
  }

  if (org.trialEndsAt !== null && org.trialEndsAt.getTime() > now.getTime()) {
    return { tier: TRIAL_TIER, source: "trial", endsAt: org.trialEndsAt };
  }

  return { tier: "free", source: "free", endsAt: null };
}

/**
 * `date` shifted forward by `months`, without mutating the input.
 *
 * The day-of-month is clamped to the target month's length, so a trial started
 * on 31 January ends on 28 February — not 3 March, which is what `setMonth`'s
 * raw overflow would produce and what a club would reasonably call a bug.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getDate();

  // Move to the 1st first, so the month shift can't overflow on its own.
  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  // Day 0 of the following month is the last day of this one.
  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(day, lastDayOfTargetMonth));

  return result;
}

/** The trial end for a club created at `from` (default: now). */
export function trialEndsAtFrom(from: Date = new Date()): Date {
  return addMonths(from, TRIAL_MONTHS);
}

/** Albanian label for where an entitlement came from, for club/admin UI. */
export const entitlementSourceLabels: Record<EntitlementSource, string> = {
  subscription: "Abonim aktiv",
  trial: "Provë falas",
  free: "Plani falas",
};
