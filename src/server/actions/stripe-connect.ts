"use server";

import { and, eq, isNull } from "drizzle-orm";

import { env } from "@/config/env";
import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { organizationMembers, organizations, trips } from "@/lib/db/schema";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";

export interface UrlResult {
  url?: string;
  error?: string;
}

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

/** Begin Stripe Connect Express onboarding so a club can receive payouts. */
export async function startConnectOnboarding(
  organizationId: string,
): Promise<UrlResult> {
  if (!isStripeConfigured()) {
    return { error: "Pagesat nuk janë konfiguruar ende." };
  }
  const session = await getOptionalSession();
  if (!session) return { error: "Duhet të jeni i kyçur." };

  const org = await requireOrgAdmin(session.user.id, organizationId);
  if (!org) return { error: "Nuk keni qasje." };

  const stripe = getStripe();

  let accountId = org.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: { organizationId: org.id },
    });
    accountId = account.id;
    await db
      .update(organizations)
      .set({ stripeConnectAccountId: accountId })
      .where(eq(organizations.id, org.id));
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/club/${org.slug}`,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/club/${org.slug}`,
    type: "account_onboarding",
  });

  return { url: link.url };
}

/**
 * Charge a hiker for a paid trip via Stripe Connect, taking a 5% platform fee
 * and routing the rest to the club. Requires the club to have completed Connect
 * onboarding. (Foundation — `registerForTrip` still handles free trips.)
 */
export async function chargeForTrip(tripId: string): Promise<UrlResult> {
  if (!isStripeConfigured()) {
    return { error: "Pagesat nuk janë konfiguruar ende." };
  }
  const session = await getOptionalSession();
  if (!session) return { error: "Duhet të jeni i kyçur." };

  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) return { error: "Udhëtimi nuk u gjet." };

  const price = Number(trip.priceEur);
  if (price <= 0) return { error: "Ky udhëtim është falas." };

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, trip.organizationId),
    columns: { stripeConnectAccountId: true },
  });
  if (!org?.stripeConnectAccountId) {
    return { error: "Klubi nuk ka aktivizuar pagesat ende." };
  }

  const amount = Math.round(price * 100);
  const checkout = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amount,
          product_data: { name: trip.title },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: Math.round(amount * 0.05),
      transfer_data: { destination: org.stripeConnectAccountId },
    },
    metadata: { tripId, userId: session.user.id },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/trips/${trip.slug}?paid=1`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/trips/${trip.slug}`,
  });

  return { url: checkout.url ?? undefined };
}
