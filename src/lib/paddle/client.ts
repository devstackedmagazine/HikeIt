import { Environment, Paddle } from "@paddle/paddle-node-sdk";

import { env } from "@/config/env";

/**
 * Paddle server client, created lazily so the app boots without billing
 * configured. Call `getPaddle()` in server actions / webhooks; it throws a
 * clear error if `PADDLE_API_KEY` is missing.
 *
 * Server-only. Never import this from a Client Component — it carries the API
 * key and the whole node SDK.
 */

let paddle: Paddle | null = null;

export function isPaddleConfigured(): boolean {
  return Boolean(env.PADDLE_API_KEY && env.PADDLE_ENV);
}

/**
 * The SDK environment, from `PADDLE_ENV` alone.
 *
 * Deliberately not inferred from the `pdl_live_` / `pdl_sdbx_` key prefix: an
 * API key pasted into the wrong environment should fail loudly against the
 * wrong API rather than quietly transact somewhere nobody intended. The
 * default is sandbox, so a missing variable can never mean "charge real
 * cards".
 */
function paddleEnvironment(): Environment {
  return env.PADDLE_ENV === "production"
    ? Environment.production
    : Environment.sandbox;
}

export function getPaddle(): Paddle {
  if (!env.PADDLE_API_KEY) {
    throw new Error("PADDLE_API_KEY is not set — billing is not configured.");
  }
  paddle ??= new Paddle(env.PADDLE_API_KEY, {
    environment: paddleEnvironment(),
  });
  return paddle;
}

export type PlanTier = "pro" | "team";
export type BillingInterval = "monthly" | "yearly";

/** A plan the club can be subscribed on, identified by its Paddle price. */
export interface PaddlePlan {
  tier: PlanTier;
  interval: BillingInterval;
  priceId: string;
}

/** Resolve a configured Paddle price id for a tier + interval, if set. */
export function getPriceId(
  tier: PlanTier,
  interval: BillingInterval,
): string | undefined {
  const ids: Record<PlanTier, Record<BillingInterval, string | undefined>> = {
    pro: {
      monthly: env.PADDLE_PRICE_PRO_MONTHLY,
      yearly: env.PADDLE_PRICE_PRO_YEARLY,
    },
    team: {
      monthly: env.PADDLE_PRICE_TEAM_MONTHLY,
      yearly: env.PADDLE_PRICE_TEAM_YEARLY,
    },
  };
  return ids[tier][interval];
}

/**
 * Reverse lookup: which plan does a Paddle price id correspond to?
 *
 * This is how a webhook learns what tier to grant. Deriving it from our own
 * configured price ids — rather than from anything in the event payload —
 * means a subscription can only ever grant a tier we actually sell. A price id
 * we don't recognise returns `null` and the caller leaves the tier alone,
 * which is the safe failure: an unrecognised price must never silently
 * downgrade a paying club.
 */
export function planFromPriceId(priceId: string | null): PaddlePlan | null {
  if (!priceId) return null;
  const tiers: PlanTier[] = ["pro", "team"];
  const intervals: BillingInterval[] = ["monthly", "yearly"];

  for (const tier of tiers) {
    for (const interval of intervals) {
      if (getPriceId(tier, interval) === priceId) {
        return { tier, interval, priceId };
      }
    }
  }
  return null;
}
