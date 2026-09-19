import type {
  SubscriptionNotification,
  TransactionNotification,
} from "@paddle/paddle-node-sdk";
import { eq } from "drizzle-orm";

import { env } from "@/config/env";
import { db } from "@/lib/db";
import { auditLogs, notifications, organizations, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { PaymentFailed } from "@/lib/email/templates/payment-failed";
import { SubscriptionActivated } from "@/lib/email/templates/subscription-activated";
import { SubscriptionCanceled } from "@/lib/email/templates/subscription-canceled";
import { planFromPriceId } from "@/lib/paddle/client";
import { captureError } from "@/lib/sentry";

/**
 * Paddle webhook handlers.
 *
 * **Idempotency.** Paddle retries, and can deliver the same event more than
 * once. Every state write here is an absolute assignment derived from the
 * event payload rather than an increment or a toggle, so re-applying an event
 * lands on the same row. The parts that are *not* naturally idempotent —
 * emails and in-app notifications — are guarded on an actual state transition
 * (`wasFree && nowPaid`), so a redelivery updates the row silently instead of
 * emailing the club owner a second time.
 *
 * **Attribution.** A club is found by `custom_data.organizationId` where the
 * event carries it (checkout), and by `paddle_customer_id` /
 * `paddle_subscription_id` otherwise. Never by email — two clubs can share an
 * owner's address.
 */

const BILLING_URL = `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;
const DASHBOARD_URL = `${env.NEXT_PUBLIC_APP_URL}/dashboard`;

/** `organizationId` out of Paddle custom data, when present and well-formed. */
function organizationIdFrom(customData: unknown): string | null {
  if (!customData || typeof customData !== "object") return null;
  const value = (customData as Record<string, unknown>).organizationId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * The Paddle price id a subscription is currently on.
 *
 * Single-item subscriptions only — HikeIt sells one plan per club, so taking
 * the first item is correct for everything we sell.
 */
function priceIdFrom(data: SubscriptionNotification): string | null {
  return data.items[0]?.price?.id ?? null;
}

/**
 * Find the club this event belongs to: custom data first (exact, set by us at
 * checkout), then the subscription id, then the customer id.
 */
async function findOrg(opts: {
  customData?: unknown;
  subscriptionId?: string | null;
  customerId?: string | null;
}) {
  const organizationId = organizationIdFrom(opts.customData);
  if (organizationId) {
    const byCustomData = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });
    if (byCustomData) return byCustomData;
  }

  if (opts.subscriptionId) {
    const bySubscription = await db.query.organizations.findFirst({
      where: eq(organizations.paddleSubscriptionId, opts.subscriptionId),
    });
    if (bySubscription) return bySubscription;
  }

  if (opts.customerId) {
    const byCustomer = await db.query.organizations.findFirst({
      where: eq(organizations.paddleCustomerId, opts.customerId),
    });
    if (byCustomer) return byCustomer;
  }

  return null;
}

async function notifyOwner(
  ownerId: string | null,
  title: string,
  body: string,
): Promise<void> {
  if (!ownerId) return;
  try {
    await db.insert(notifications).values({
      userId: ownerId,
      type: "billing",
      title,
      body,
      link: "/dashboard/billing",
    });
  } catch {
    // Best-effort — never fail a webhook over a notification row.
  }
}

async function ownerEmail(ownerId: string | null): Promise<string | null> {
  if (!ownerId) return null;
  const u = await db.query.users.findFirst({
    where: eq(users.id, ownerId),
    columns: { email: true },
  });
  return u?.email ?? null;
}

function periodEndFrom(data: SubscriptionNotification): Date | null {
  const endsAt = data.currentBillingPeriod?.endsAt;
  if (!endsAt) return null;
  const parsed = new Date(endsAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * `subscription.created` and `subscription.updated` both land here.
 *
 * One handler because the correct behaviour is identical: write the
 * subscription's current state onto the club. Splitting them would mean two
 * code paths that must agree, and Paddle can deliver `updated` before
 * `created` on a retry.
 */
export async function handleSubscriptionChanged(
  data: SubscriptionNotification,
): Promise<void> {
  const org = await findOrg({
    customData: data.customData,
    subscriptionId: data.id,
    customerId: data.customerId,
  });

  if (!org) {
    // A subscription exists at Paddle with no club to attach it to — someone
    // is being billed for nothing. Needs a human, not a retry.
    captureError(new Error("Paddle subscription with no matching club"), {
      action: "handleSubscriptionChanged",
      extra: {
        subscriptionId: data.id,
        customerId: data.customerId,
        status: data.status,
      },
    });
    return;
  }

  const priceId = priceIdFrom(data);
  const plan = planFromPriceId(priceId);

  // An unrecognised price must never silently downgrade a paying club — leave
  // the tier as it is and report it instead.
  if (!plan) {
    captureError(new Error("Paddle subscription on an unrecognised price"), {
      action: "handleSubscriptionChanged",
      extra: { subscriptionId: data.id, priceId, organizationId: org.id },
    });
  }

  // `active` and `trialing` both entitle the club; anything else (paused,
  // past_due, canceled) does not grant a new tier here. past_due deliberately
  // keeps access — see handleSubscriptionPastDue.
  const entitled = data.status === "active" || data.status === "trialing";
  const wasPaid = org.subscriptionTier !== "free";

  await db
    .update(organizations)
    .set({
      paddleSubscriptionId: data.id,
      paddleCustomerId: data.customerId,
      paddleSubscriptionStatus: data.scheduledChange?.action === "cancel"
        ? "canceling"
        : data.status,
      paddlePriceId: priceId,
      subscriptionCurrentPeriodEnd: periodEndFrom(data),
      ...(plan && entitled ? { subscriptionTier: plan.tier } : {}),
    })
    .where(eq(organizations.id, org.id));

  await db.insert(auditLogs).values({
    action: "subscription.updated",
    entityType: "organization",
    entityId: org.id,
    metadata: {
      subscriptionId: data.id,
      status: data.status,
      priceId,
      tier: plan?.tier ?? null,
    },
  });

  // Only announce a genuine free → paid transition. A redelivered event, or a
  // routine renewal update, must not email the owner again.
  if (!(plan && entitled && !wasPaid)) return;

  const planName = plan.tier === "team" ? "Team" : "Pro";
  await notifyOwner(
    org.ownerId,
    `Abonimi juaj ${planName} është aktivizuar!`,
    "Faleminderit! Veçoritë e klubit janë tani aktive.",
  );

  const email = await ownerEmail(org.ownerId);
  if (email) {
    try {
      await sendEmail({
        to: email,
        subject: "Abonimi juaj HikeIt është aktiv",
        template: SubscriptionActivated({
          planName,
          dashboardUrl: DASHBOARD_URL,
        }),
      });
    } catch {
      // Best-effort.
    }
  }
}

/** The subscription ended: drop the club to free. */
export async function handleSubscriptionCanceled(
  data: SubscriptionNotification,
): Promise<void> {
  const org = await findOrg({
    customData: data.customData,
    subscriptionId: data.id,
    customerId: data.customerId,
  });
  if (!org) return;

  // Idempotency: a redelivery finds the club already on free and stops before
  // emailing "your subscription ended" a second time.
  if (org.subscriptionTier === "free" && !org.paddleSubscriptionId) return;

  await db
    .update(organizations)
    .set({
      subscriptionTier: "free",
      paddleSubscriptionStatus: "canceled",
      paddleSubscriptionId: null,
      paddlePriceId: null,
      subscriptionCurrentPeriodEnd: null,
    })
    .where(eq(organizations.id, org.id));

  await db.insert(auditLogs).values({
    action: "subscription.canceled",
    entityType: "organization",
    entityId: org.id,
    metadata: { subscriptionId: data.id },
  });

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
      // Best-effort.
    }
  }
}

/**
 * Payment is overdue.
 *
 * Access is deliberately **not** revoked here. Paddle runs its own dunning
 * retries for days; cutting a club off on the first failed charge would punish
 * an expired card mid-season. If dunning ultimately fails Paddle sends
 * `subscription.canceled`, and that is where the downgrade belongs.
 */
export async function handleSubscriptionPastDue(
  data: SubscriptionNotification,
): Promise<void> {
  const org = await findOrg({
    customData: data.customData,
    subscriptionId: data.id,
    customerId: data.customerId,
  });
  if (!org) return;

  // Idempotency: already flagged, nothing new to say.
  if (org.paddleSubscriptionStatus === "past_due") return;

  await db
    .update(organizations)
    .set({ paddleSubscriptionStatus: "past_due" })
    .where(eq(organizations.id, org.id));

  await db.insert(auditLogs).values({
    action: "subscription.past_due",
    entityType: "organization",
    entityId: org.id,
    metadata: { subscriptionId: data.id },
  });

  await notifyOwner(
    org.ownerId,
    "Pagesa është vonuar",
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
      // Best-effort.
    }
  }
}

/**
 * A transaction completed — a first payment or a renewal.
 *
 * Purely a record. The tier comes from the subscription events, never from
 * here: a completed transaction says money moved, not what the club is
 * entitled to.
 */
export async function handleTransactionCompleted(
  data: TransactionNotification,
): Promise<void> {
  const org = await findOrg({
    customData: data.customData,
    subscriptionId: data.subscriptionId,
    customerId: data.customerId,
  });

  await db.insert(auditLogs).values({
    action: "transaction.completed",
    entityType: "organization",
    entityId: org?.id ?? null,
    metadata: {
      transactionId: data.id,
      subscriptionId: data.subscriptionId ?? null,
      // Paddle reports money as a minor-unit string. Kept exactly as sent —
      // parsing it to a float here would be the one place money math could
      // drift, for a value nothing computes on.
      grandTotal: data.details?.totals?.grandTotal ?? null,
      currency: data.currencyCode ?? null,
    },
  });
}

/** A charge failed. Paddle will retry; this is the club-facing heads-up. */
export async function handleTransactionPaymentFailed(
  data: TransactionNotification,
): Promise<void> {
  const org = await findOrg({
    customData: data.customData,
    subscriptionId: data.subscriptionId,
    customerId: data.customerId,
  });
  if (!org) return;

  await db.insert(auditLogs).values({
    action: "transaction.payment_failed",
    entityType: "organization",
    entityId: org.id,
    metadata: {
      transactionId: data.id,
      subscriptionId: data.subscriptionId ?? null,
    },
  });

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
      // Best-effort.
    }
  }
}
