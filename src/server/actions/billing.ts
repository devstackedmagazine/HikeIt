"use server";

import { and, eq, isNull } from "drizzle-orm";

import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { inviteCodes, organizationMembers, organizations } from "@/lib/db/schema";
import {
  type BillingInterval,
  getPaddle,
  getPriceId,
  isPaddleConfigured,
  type PlanTier,
} from "@/lib/paddle/client";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureError } from "@/lib/sentry";

/**
 * Club subscription billing, on Paddle.
 *
 * Checkout is an overlay opened by Paddle.js in the browser, so there is no
 * server-created session to redirect to. What the server does instead is
 * everything the client must not be trusted with: authorise the caller, pick
 * the price from env, look up the club's Paddle customer and any invite-code
 * discount, and stamp `organizationId` into custom data so the webhook can
 * attribute the subscription. The client opens the overlay with exactly what
 * it is given and nothing more.
 */

/** Everything Paddle.js needs to open the overlay for this club. */
export interface CheckoutConfig {
  priceId: string;
  /** Read back by the webhook to attribute the subscription to a club. */
  customData: { organizationId: string; tier: PlanTier };
  /** Existing Paddle customer, so returning clubs aren't asked to re-enter. */
  customerId?: string;
  /** Prefill for a club that has never reached checkout. */
  customerEmail?: string;
  /** Paddle discount from the club's redeemed invite code, if it carried one. */
  discountId?: string;
}

export interface CheckoutResult {
  config?: CheckoutConfig;
  error?: string;
}

export interface UrlResult {
  url?: string;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** Verify the user is an active admin of an org; returns the org row or null. */
async function requireOrgAdmin(userId: string, organizationId: string) {
  const rows = await db
    .select({ org: organizations })
    .from(organizations)
    .innerJoin(
      organizationMembers,
      and(
        eq(organizationMembers.organizationId, organizations.id),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.role, "admin"),
        isNull(organizationMembers.leftAt),
      ),
    )
    .where(eq(organizations.id, organizationId))
    .limit(1);
  return rows[0]?.org ?? null;
}

/**
 * The Paddle discount a club earned by redeeming an invite code, if any.
 *
 * Looked up fresh at checkout rather than copied onto the organization at
 * signup, so correcting a wrong discount id on the code fixes every club that
 * redeemed it. Best-effort: a missing or broken code must never block a club
 * from subscribing at full price.
 */
async function discountForClub(
  inviteCodeUsed: string | null,
): Promise<string | undefined> {
  if (!inviteCodeUsed) return undefined;
  try {
    const row = await db.query.inviteCodes.findFirst({
      where: eq(inviteCodes.code, inviteCodeUsed),
      columns: { paddleDiscountId: true },
    });
    return row?.paddleDiscountId ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Build the overlay checkout config for a club.
 *
 * No Paddle API call is made here — creating a customer up front would leave
 * orphaned records for every club that opens the overlay and changes its mind.
 * Paddle creates the customer when the transaction completes, and the webhook
 * records the id.
 */
export async function createCheckout(data: {
  organizationId: string;
  tier: PlanTier;
  interval: BillingInterval;
}): Promise<CheckoutResult> {
  if (!isPaddleConfigured()) {
    return { error: "Pagesat nuk janë konfiguruar ende." };
  }
  const session = await getOptionalSession();
  if (!session) return { error: "Duhet të jeni i kyçur." };

  const org = await requireOrgAdmin(session.user.id, data.organizationId);
  if (!org) return { error: "Nuk keni qasje." };

  const limited = await enforceRateLimit("ratelimit.billing.checkout", {
    userId: session.user.id,
  });
  if (limited) return { error: limited };

  const priceId = getPriceId(data.tier, data.interval);
  if (!priceId) return { error: "Plani nuk është i disponueshëm." };

  const discountId = await discountForClub(org.inviteCodeUsed);

  return {
    config: {
      priceId,
      customData: { organizationId: org.id, tier: data.tier },
      ...(org.paddleCustomerId
        ? { customerId: org.paddleCustomerId }
        : { customerEmail: session.user.email }),
      ...(discountId ? { discountId } : {}),
    },
  };
}

/**
 * An authenticated Paddle customer-portal link for this club.
 *
 * Paddle's portal handles cancellation, payment-method updates and invoice
 * history, so none of that is rebuilt here. Sessions are single-use and must
 * not be cached — a fresh one is minted per click, which is why this is an
 * action rather than something resolved during render.
 */
export async function createPortalSession(
  organizationId: string,
): Promise<UrlResult> {
  if (!isPaddleConfigured()) {
    return { error: "Pagesat nuk janë konfiguruar ende." };
  }
  const session = await getOptionalSession();
  if (!session) return { error: "Duhet të jeni i kyçur." };

  const org = await requireOrgAdmin(session.user.id, organizationId);
  if (!org?.paddleCustomerId) {
    return { error: "Nuk u gjet abonim." };
  }

  const limited = await enforceRateLimit("ratelimit.billing.portal", {
    userId: session.user.id,
  });
  if (limited) return { error: limited };

  try {
    // Passing the subscription id asks Paddle for per-subscription deep links
    // alongside the general portal URL.
    const portal = await getPaddle().customerPortalSessions.create(
      org.paddleCustomerId,
      org.paddleSubscriptionId ? [org.paddleSubscriptionId] : [],
    );

    const url = portal.urls.general.overview;
    if (!url) return { error: "Nuk u hap portali. Provoni sërish." };
    return { url };
  } catch (error) {
    captureError(error, {
      action: "createPortalSession",
      userId: session.user.id,
      extra: { organizationId },
    });
    return { error: "Nuk u hap portali. Provoni sërish." };
  }
}

/**
 * Cancel at period end.
 *
 * The portal can do this too, and is the better route for a club that wants to
 * see what it's giving up first. This exists so the billing page can offer a
 * direct action without a round-trip to Paddle's UI. The tier is not changed
 * here — `subscription.canceled` does that when the period actually ends, so a
 * club keeps what it paid for until the day it expires.
 */
export async function cancelSubscription(
  organizationId: string,
): Promise<ActionResult> {
  if (!isPaddleConfigured()) {
    return { success: false, error: "Pagesat nuk janë konfiguruar." };
  }
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const org = await requireOrgAdmin(session.user.id, organizationId);
  if (!org?.paddleSubscriptionId) {
    return { success: false, error: "Nuk u gjet abonim." };
  }

  const limited = await enforceRateLimit("ratelimit.billing.cancel", {
    userId: session.user.id,
  });
  if (limited) return { success: false, error: limited };

  try {
    await getPaddle().subscriptions.cancel(org.paddleSubscriptionId, {
      effectiveFrom: "next_billing_period",
    });
    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "cancelSubscription",
      userId: session.user.id,
      extra: { organizationId },
    });
    return { success: false, error: "Anulimi dështoi. Provoni sërish." };
  }
}
