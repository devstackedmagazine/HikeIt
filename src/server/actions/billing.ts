"use server";

import { and, eq, isNull } from "drizzle-orm";

import { env } from "@/config/env";
import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema";
import {
  type BillingInterval,
  getPriceId,
  getStripe,
  isStripeConfigured,
  type PlanTier,
} from "@/lib/stripe/client";

export interface UrlResult {
  url?: string;
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

export async function createCheckoutSession(data: {
  organizationId: string;
  tier: PlanTier;
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}): Promise<UrlResult> {
  if (!isStripeConfigured()) {
    return { error: "Pagesat nuk janë konfiguruar ende." };
  }
  const session = await getOptionalSession();
  if (!session) return { error: "Duhet të jeni i kyçur." };

  const org = await requireOrgAdmin(session.user.id, data.organizationId);
  if (!org) return { error: "Nuk keni qasje." };

  const priceId = getPriceId(data.tier, data.interval);
  if (!priceId) return { error: "Plani nuk është i disponueshëm." };

  const stripe = getStripe();

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      email: session.user.email,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await db
      .update(organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(organizations.id, org.id));
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { organizationId: org.id, tier: data.tier },
    subscription_data: {
      trial_period_days: 14,
      metadata: { organizationId: org.id, tier: data.tier },
    },
    allow_promotion_codes: true,
    success_url: data.successUrl,
    cancel_url: data.cancelUrl,
  });

  return { url: checkout.url ?? undefined };
}

export async function createPortalSession(
  organizationId: string,
): Promise<UrlResult> {
  if (!isStripeConfigured()) {
    return { error: "Pagesat nuk janë konfiguruar ende." };
  }
  const session = await getOptionalSession();
  if (!session) return { error: "Duhet të jeni i kyçur." };

  const org = await requireOrgAdmin(session.user.id, organizationId);
  if (!org?.stripeCustomerId) {
    return { error: "Nuk u gjet abonim." };
  }

  const portal = await getStripe().billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  return { url: portal.url };
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function cancelSubscription(
  organizationId: string,
): Promise<ActionResult> {
  if (!isStripeConfigured()) {
    return { success: false, error: "Pagesat nuk janë konfiguruar." };
  }
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const org = await requireOrgAdmin(session.user.id, organizationId);
  if (!org?.stripeSubscriptionId) {
    return { success: false, error: "Nuk u gjet abonim." };
  }

  await getStripe().subscriptions.update(org.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
  return { success: true };
}
