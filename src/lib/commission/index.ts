import type { CommissionOverrideReason } from "@/lib/db/schema";

/**
 * Commission resolution — the single source of truth for what HikeIt charges a
 * club on a paid trip.
 *
 * Every caller (Checkout Session creation, club settings, the admin panel, the
 * trial cron) goes through `resolveCommission`. Nothing recomputes a rate
 * inline: a club's rate is a function of its row, and it must resolve
 * identically everywhere or the fee we charge stops matching the fee we show.
 *
 * This module is intentionally pure — no DB, no I/O, no `Date.now()` except as
 * a default argument — so it can be reasoned about and unit-tested directly.
 */

/** HikeIt's platform commission once no trial or override applies. */
export const DEFAULT_COMMISSION_RATE = 0.025;

/** Months of 0% commission every new club gets automatically. */
export const TRIAL_MONTHS = 3;

/** Days before a trial ends that we email the club owner. */
export const TRIAL_ENDING_NOTICE_DAYS = 7;

/** Which rule produced the resolved rate. */
export type CommissionSource =
  | "super_admin"
  | "invite_code"
  | "trial"
  | "default";

export interface ResolvedCommission {
  /** Decimal rate in [0, DEFAULT_COMMISSION_RATE], e.g. 0.025 or 0. */
  rate: number;
  source: CommissionSource;
  /** When this rate stops applying. `null` = indefinitely. */
  endsAt: Date | null;
}

/**
 * The organization fields commission resolution depends on. Deliberately a
 * structural subset of `Organization` rather than the row itself, so callers
 * can `select` just these four columns. `commissionRate` is `string | null`
 * because Drizzle returns `numeric` as a string.
 */
export interface CommissionOrganization {
  commissionRate: string | null;
  commissionOverrideUntil: Date | null;
  commissionOverrideReason: CommissionOverrideReason | null;
  trialEndsAt: Date | null;
}

/**
 * Resolve the commission rate for a club, in priority order:
 *
 * 1. **Super admin grant / invite code** — an explicit `commissionRate` that
 *    hasn't expired. Highest priority; overrides everything.
 * 2. **Free trial** — `trialEndsAt` in the future → 0%.
 * 3. **Default** — 2.5%.
 *
 * A club whose trial and override have both lapsed transitions to the default
 * silently: there is no state to flip, the rate simply resolves differently
 * once the timestamps are in the past.
 */
export function resolveCommission(
  org: CommissionOrganization,
  now: Date = new Date(),
): ResolvedCommission {
  const overrideActive =
    org.commissionRate !== null &&
    (org.commissionOverrideUntil === null ||
      org.commissionOverrideUntil.getTime() > now.getTime());

  if (overrideActive) {
    const parsed = Number(org.commissionRate);
    // A malformed rate must never become a *higher* charge than the default,
    // so fall back to the default rather than trusting NaN through to Stripe.
    if (Number.isFinite(parsed)) {
      return {
        rate: clampRate(parsed),
        // The column is constrained to these two values, but default to the
        // more conservative attribution if it's ever null.
        source: org.commissionOverrideReason ?? "super_admin",
        endsAt: org.commissionOverrideUntil,
      };
    }
  }

  if (org.trialEndsAt !== null && org.trialEndsAt.getTime() > now.getTime()) {
    return { rate: 0, source: "trial", endsAt: org.trialEndsAt };
  }

  return { rate: DEFAULT_COMMISSION_RATE, source: "default", endsAt: null };
}

/** Constrain a rate to [0, DEFAULT_COMMISSION_RATE]. */
export function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return DEFAULT_COMMISSION_RATE;
  return Math.min(Math.max(rate, 0), DEFAULT_COMMISSION_RATE);
}

/**
 * HikeIt's fee on an amount, in integer cents. All money math stays in cents —
 * `amountCents` is already an integer, and the product is rounded to one.
 */
export function commissionFeeCents(amountCents: number, rate: number): number {
  return Math.round(amountCents * rate);
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

/**
 * Format a decimal rate as an Albanian-facing percentage: 0.025 → "2.5%",
 * 0 → "0%". Trailing zeros are trimmed so we never render "2.50%".
 */
export function formatRatePercent(rate: number): string {
  const percent = rate * 100;
  const rounded = Math.round(percent * 100) / 100;
  return `${String(rounded)}%`;
}

/** Albanian label for where a rate came from, for admin/club-facing UI. */
export const commissionSourceLabels: Record<CommissionSource, string> = {
  super_admin: "Caktuar nga HikeIt",
  invite_code: "Kod ftese",
  trial: "Provë falas",
  default: "Standard",
};
