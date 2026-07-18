import { and, count, eq } from "drizzle-orm";
import type Stripe from "stripe";

import { env } from "@/config/env";
import { db } from "@/lib/db";
import {
  auditLogs,
  notifications,
  organizations,
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { PaymentFailed } from "@/lib/email/templates/payment-failed";
import { SubscriptionActivated } from "@/lib/email/templates/subscription-activated";
import { SubscriptionCanceled } from "@/lib/email/templates/subscription-canceled";
import { TripConfirmation } from "@/lib/email/templates/trip-confirmation";
import { captureMessage } from "@/lib/sentry";
import { mapAccountStatus } from "@/lib/stripe/connect-status";
import { formatTripDateTime, googleCalendarUrl } from "@/lib/utils/datetime";

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
  // Trip-payment Checkout Sessions also carry `organizationId` (for the
  // Connect transfer) but are confirmed via the PaymentIntent webhooks
  // instead — never treat one as a subscription checkout.
  if (session.metadata?.tripId) return;

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

// ── Trip payments (Stripe Connect) ──────────────────────────────────────────

/**
 * A hiker's trip payment succeeded: confirm the registration, record the
 * charge + amounts, notify + email the hiker, flip the trip to "full" if the
 * last seat just went, and audit-log it.
 */
export async function handleTripPaymentSucceeded(
  intent: Stripe.PaymentIntent,
): Promise<void> {
  // The Checkout Session's PaymentIntent id isn't known when we create the
  // pending registration (Stripe makes it asynchronously), so the row may
  // still have a null stripePaymentIntentId. Look up by intent id first, then
  // fall back to the tripId+userId we stamped on the intent's metadata.
  const byIntent = await db.query.tripRegistrations.findFirst({
    where: eq(tripRegistrations.stripePaymentIntentId, intent.id),
  });
  const byMetadata =
    !byIntent && intent.metadata?.tripId && intent.metadata?.userId
      ? await db.query.tripRegistrations.findFirst({
          where: and(
            eq(tripRegistrations.tripId, intent.metadata.tripId),
            eq(tripRegistrations.userId, intent.metadata.userId),
          ),
        })
      : undefined;
  const registration = byIntent ?? byMetadata;

  // Diagnostic: make the lookup outcome visible in Sentry while we stabilize
  // the async-PaymentIntent correlation.
  captureMessage(
    "trip.payment.succeeded lookup",
    registration ? "info" : "warning",
    {
      intentId: intent.id,
      metadataTripId: intent.metadata?.tripId ?? null,
      metadataUserId: intent.metadata?.userId ?? null,
      matchedBy: byIntent ? "intentId" : byMetadata ? "metadata" : "none",
      registrationId: registration?.id ?? null,
      registrationPaymentStatus: registration?.paymentStatus ?? null,
    },
  );

  if (!registration) return;
  // Idempotency: Stripe can deliver the same event more than once.
  if (registration.paymentStatus === "paid") return;

  const amountEur = (intent.amount_received || intent.amount) / 100;
  const feeEur = (intent.application_fee_amount ?? 0) / 100;
  const chargeId =
    typeof intent.latest_charge === "string"
      ? intent.latest_charge
      : (intent.latest_charge?.id ?? null);

  await db
    .update(tripRegistrations)
    .set({
      status: "confirmed",
      paymentStatus: "paid",
      stripePaymentIntentId: intent.id,
      stripeChargeId: chargeId,
      amountPaidEur: amountEur.toFixed(2),
      platformFeeEur: feeEur.toFixed(2),
    })
    .where(eq(tripRegistrations.id, registration.id));

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, registration.tripId),
  });

  await db.insert(auditLogs).values({
    userId: registration.userId,
    action: "trip.payment.succeeded",
    entityType: "trip",
    entityId: registration.tripId,
    metadata: {
      registrationId: registration.id,
      amountEur,
      feeEur,
      paymentIntentId: intent.id,
    },
  });

  await db.insert(notifications).values({
    userId: registration.userId,
    type: "trip",
    title: "Pagesa u konfirmua",
    body: trip
      ? `Regjistrimi juaj për "${trip.title}" u konfirmua.`
      : "Regjistrimi juaj u konfirmua.",
    link: trip ? `/trips/${trip.slug}` : "/dashboard/my-trips",
  });

  if (trip) {
    // Flip to "full" if confirmed registrations now fill it.
    if (trip.maxParticipants !== null) {
      const [row] = await db
        .select({ value: count() })
        .from(tripRegistrations)
        .where(
          and(
            eq(tripRegistrations.tripId, trip.id),
            eq(tripRegistrations.status, "confirmed"),
          ),
        );
      if ((row?.value ?? 0) >= trip.maxParticipants && trip.status === "open") {
        await db
          .update(trips)
          .set({ status: "full" })
          .where(eq(trips.id, trip.id));
      }
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, registration.userId),
      columns: { email: true },
    });
    if (user?.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: `Regjistrimi u konfirmua: ${trip.title}`,
          template: TripConfirmation({
            tripTitle: trip.title,
            dateLabel: formatTripDateTime(trip.startDatetime),
            meetingPoint: trip.meetingPoint,
            tripUrl: `${env.NEXT_PUBLIC_APP_URL}/trips/${trip.slug}`,
            calendarUrl: googleCalendarUrl({
              title: trip.title,
              start: trip.startDatetime,
              end: trip.endDatetime,
              location: trip.meetingPoint ?? undefined,
            }),
          }),
        });
      } catch {
        // best-effort
      }
    }
  }
}

/** A hiker's trip payment failed: cancel the pending registration. */
export async function handleTripPaymentFailed(
  intent: Stripe.PaymentIntent,
): Promise<void> {
  // Same lookup fallback as the success handler — the pending row may not have
  // the intent id yet, so fall back to tripId+userId from the intent metadata.
  const registration =
    (await db.query.tripRegistrations.findFirst({
      where: eq(tripRegistrations.stripePaymentIntentId, intent.id),
    })) ??
    (intent.metadata?.tripId && intent.metadata?.userId
      ? await db.query.tripRegistrations.findFirst({
          where: and(
            eq(tripRegistrations.tripId, intent.metadata.tripId),
            eq(tripRegistrations.userId, intent.metadata.userId),
          ),
        })
      : undefined);
  if (!registration || registration.paymentStatus === "paid") return;

  await db
    .update(tripRegistrations)
    .set({
      status: "canceled",
      paymentStatus: "failed",
      canceledAt: new Date(),
    })
    .where(eq(tripRegistrations.id, registration.id));

  await db.insert(auditLogs).values({
    userId: registration.userId,
    action: "trip.payment.failed",
    entityType: "trip",
    entityId: registration.tripId,
    metadata: { registrationId: registration.id, paymentIntentId: intent.id },
  });
}

/**
 * A club's Connect account changed: sync our status enum from
 * charges_enabled / details_submitted.
 */
export async function handleConnectAccountUpdated(
  account: Stripe.Account,
): Promise<void> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.stripeConnectAccountId, account.id),
    columns: { id: true, stripeOnboardingCompletedAt: true },
  });
  if (!org) return;

  const status = mapAccountStatus(account);
  await db
    .update(organizations)
    .set({
      stripeAccountStatus: status,
      stripeOnboardingCompletedAt:
        status === "active" && !org.stripeOnboardingCompletedAt
          ? new Date()
          : org.stripeOnboardingCompletedAt,
    })
    .where(eq(organizations.id, org.id));

  await db.insert(auditLogs).values({
    action: "stripe.account.updated",
    entityType: "organization",
    entityId: org.id,
    metadata: { status, accountId: account.id },
  });
}
