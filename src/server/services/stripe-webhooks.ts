import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { env } from "@/config/env";
import { db } from "@/lib/db";
import {
  auditLogs,
  notifications,
  organizations,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { PaymentFailed } from "@/lib/email/templates/payment-failed";
import { SubscriptionActivated } from "@/lib/email/templates/subscription-activated";
import { SubscriptionCanceled } from "@/lib/email/templates/subscription-canceled";

const BILLING_URL = `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;
const DASHBOARD_URL = `${env.NEXT_PUBLIC_APP_URL}/dashboard`;

type Tier = "free" | "pro" | "team";

async function findOrgByCustomer(customerId: string) {
  return db.query.organizations.findFirst({
    where: eq(organizations.stripeCustomerId, customerId),
  });
}

async function notifyOwner(
  ownerId: string | null,
  title: string,
  body: string,
): Promise<void> {
  if (!ownerId) return;
  await db.insert(notifications).values({
    userId: ownerId,
    type: "billing",
    title,
    body,
    link: "/dashboard/billing",
  });
}

async function ownerEmail(ownerId: string | null): Promise<string | null> {
  if (!ownerId) return null;
  const u = await db.query.users.findFirst({
    where: eq(users.id, ownerId),
    columns: { email: true },
  });
  return u?.email ?? null;
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const organizationId = session.metadata?.organizationId;
  const tier = (session.metadata?.tier as Tier) ?? "pro";
  if (!organizationId) return;

  await db
    .update(organizations)
    .set({
      subscriptionTier: tier,
      stripeSubscriptionId:
        typeof session.subscription === "string" ? session.subscription : null,
      subscriptionStatus: "active",
    })
    .where(eq(organizations.id, organizationId));

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: { ownerId: true },
  });

  await notifyOwner(
    org?.ownerId ?? null,
    `Abonimi juaj ${tier === "team" ? "Team" : "Pro"} është aktivizuar!`,
    "Faleminderit! Veçoritë e klubit janë tani aktive.",
  );
  await db.insert(auditLogs).values({
    action: "subscription.activated",
    entityType: "organization",
    entityId: organizationId,
    metadata: { tier },
  });

  const email = await ownerEmail(org?.ownerId ?? null);
  if (email) {
    try {
      await sendEmail({
        to: email,
        subject: "Abonimi juaj HikeIt është aktiv",
        template: SubscriptionActivated({
          planName: tier === "team" ? "Team" : "Pro",
          dashboardUrl: DASHBOARD_URL,
        }),
      });
    } catch {
      // best-effort
    }
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const org = await findOrgByCustomer(customerId);
  if (!org) return;

  const tier = subscription.metadata?.tier as Tier | undefined;
  await db
    .update(organizations)
    .set({
      subscriptionStatus: subscription.cancel_at_period_end
        ? "canceling"
        : subscription.status,
      stripeSubscriptionId: subscription.id,
      ...(tier ? { subscriptionTier: tier } : {}),
    })
    .where(eq(organizations.id, org.id));
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const org = await findOrgByCustomer(customerId);
  if (!org) return;

  await db
    .update(organizations)
    .set({
      subscriptionTier: "free",
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
    })
    .where(eq(organizations.id, org.id));

  await notifyOwner(
    org.ownerId,
    "Abonimi juaj ka përfunduar",
    "Klubi juaj kaloi në planin falas.",
  );

  const email = await ownerEmail(org.ownerId);
  if (email) {
    try {
      await sendEmail({
        to: email,
        subject: "Abonimi juaj ka përfunduar",
        template: SubscriptionCanceled({ billingUrl: BILLING_URL }),
      });
    } catch {
      // best-effort
    }
  }
}

export async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
): Promise<void> {
  await db.insert(auditLogs).values({
    action: "invoice.payment_succeeded",
    entityType: "invoice",
    metadata: { invoiceId: invoice.id, amount: invoice.amount_paid },
  });
}

export async function handlePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : (invoice.customer?.id ?? null);
  if (!customerId) return;
  const org = await findOrgByCustomer(customerId);
  if (!org) return;

  await notifyOwner(
    org.ownerId,
    "Pagesa dështoi",
    "Përditësoni metodën e pagesës për të mbajtur abonimin aktiv.",
  );

  const email = await ownerEmail(org.ownerId);
  if (email) {
    try {
      await sendEmail({
        to: email,
        subject: "Pagesa dështoi — HikeIt",
        template: PaymentFailed({ billingUrl: BILLING_URL }),
      });
    } catch {
      // best-effort
    }
  }
}
