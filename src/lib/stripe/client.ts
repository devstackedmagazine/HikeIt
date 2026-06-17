import Stripe from "stripe";

import { env } from "@/config/env";

/**
 * Stripe server client, created lazily so the app boots without billing
 * configured. Call `getStripe()` in server actions / webhooks; it throws a
 * clear error if `STRIPE_SECRET_KEY` is missing.
 */
let stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set — billing is not configured.");
  }
  stripe ??= new Stripe(env.STRIPE_SECRET_KEY, { typescript: true });
  return stripe;
}

export type PlanTier = "pro" | "team";
export type BillingInterval = "monthly" | "yearly";

/** Resolve a configured Stripe price id for a tier + interval, if set. */
export function getPriceId(
  tier: PlanTier,
  interval: BillingInterval,
): string | undefined {
  const map = {
    pro: {
      monthly: env.STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly: env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
    team: {
      monthly: env.STRIPE_TEAM_MONTHLY_PRICE_ID,
      yearly: env.STRIPE_TEAM_YEARLY_PRICE_ID,
    },
  } as const;
  return map[tier][interval];
}
