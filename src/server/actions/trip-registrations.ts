"use server";

import { and, count, eq, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ReactElement } from "react";

import { env } from "@/config/env";
import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  auditLogs,
  notifications,
  organizationMembers,
  organizations,
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { GenericMessage } from "@/lib/email/templates/generic-message";
import { TripCancellation } from "@/lib/email/templates/trip-cancellation";
import { TripConfirmation } from "@/lib/email/templates/trip-confirmation";
import { captureError, trackEvent } from "@/lib/sentry";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import {
  formatTripDateTime,
  googleCalendarUrl,
} from "@/lib/utils/datetime";

/** HikeIt's platform commission on every paid trip registration. */
const PLATFORM_FEE_RATE = 0.025;

export interface RegisterResult {
  success: boolean;
  /** "free" → confirmed/waitlisted directly; "paid" → redirect to Checkout. */
  type?: "free" | "paid";
  status?: "confirmed" | "waitlisted";
  /** Present when `type === "paid"`: full-page redirect to Stripe Checkout. */
  checkoutUrl?: string;
  error?: string;
}

/** True if the user is an active admin/organizer of the given org. */
async function isClubManager(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const row = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, organizationId),
      eq(organizationMembers.userId, userId),
      isNull(organizationMembers.leftAt),
    ),
    columns: { role: true },
  });
  return row?.role === "admin" || row?.role === "organizer";
}

/**
 * Register the current user for a trip.
 *
 * - Free trip (priceEur ≤ 0): confirmed immediately (or waitlisted if full),
 *   returns `{ type: "free" }`.
 * - Paid trip: creates a Stripe Checkout Session routed to the club's Connect
 *   account with HikeIt's 2.5% application fee, records a `pending`
 *   registration, and returns `{ type: "paid", checkoutUrl }` for the client
 *   to redirect to Stripe's hosted page. The webhook confirms it on success —
 *   the client never marks a registration confirmed on its own.
 */
export async function registerForTrip(tripId: string): Promise<RegisterResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) return { success: false, error: "Udhëtimi nuk u gjet." };
  if (trip.status !== "open") {
    return { success: false, error: "Ky udhëtim nuk është i hapur." };
  }

  const existing = await db.query.tripRegistrations.findFirst({
    where: and(
      eq(tripRegistrations.tripId, tripId),
      eq(tripRegistrations.userId, session.user.id),
      ne(tripRegistrations.status, "canceled"),
    ),
  });
  // A prior *pending payment* attempt is allowed to resume (see paid path);
  // any other non-canceled registration means they're already in.
  if (existing && existing.paymentStatus !== "pending") {
    return { success: false, error: "Jeni tashmë i regjistruar." };
  }

  // No active registration — check for a prior canceled one. A hiker who was
  // refunded (or never paid) may re-register with a brand-new row; one whose
  // cancellation wasn't refunded (an edge case — cancellation normally always
  // refunds) must contact the club instead of silently paying again.
  let isReregistration = false;
  if (!existing) {
    const canceled = await db.query.tripRegistrations.findFirst({
      where: and(
        eq(tripRegistrations.tripId, tripId),
        eq(tripRegistrations.userId, session.user.id),
        eq(tripRegistrations.status, "canceled"),
      ),
      orderBy: (t, { desc }) => [desc(t.canceledAt)],
    });
    if (canceled) {
      if (canceled.paymentStatus === "paid") {
        return {
          success: false,
          error:
            "Ju keni një regjistrim të anuluar pa rimbursim. Kontaktoni klubin.",
        };
      }
      isReregistration = true;
    }
  }

  const price = Number(trip.priceEur ?? 0);
  return price > 0
    ? registerPaid(session.user.id, trip, existing?.id ?? null, isReregistration)
    : registerFree(session.user.id, trip, isReregistration);
}

/** Free trip: confirm (or waitlist), email, revalidate. */
async function registerFree(
  userId: string,
  trip: typeof trips.$inferSelect,
  isReregistration: boolean,
): Promise<RegisterResult> {
  const confirmed = await confirmedCountFor(trip.id);
  const isFull =
    trip.maxParticipants !== null && confirmed >= trip.maxParticipants;
  const status = isFull ? "waitlisted" : "confirmed";

  await db.insert(tripRegistrations).values({
    tripId: trip.id,
    userId,
    status,
    paymentStatus: "free",
    isReregistration,
  });

  if (
    status === "confirmed" &&
    trip.maxParticipants !== null &&
    confirmed + 1 >= trip.maxParticipants
  ) {
    await db.update(trips).set({ status: "full" }).where(eq(trips.id, trip.id));
  }

  await db.insert(auditLogs).values({
    userId,
    action: "trip.registered",
    entityType: "trip",
    entityId: trip.id,
    metadata: { organizationId: trip.organizationId, status },
  });

  if (status === "confirmed") void sendConfirmation(userId, trip);

  revalidatePath(`/trips/${trip.slug}`);
  revalidatePath("/dashboard/my-trips");
  return { success: true, type: "free", status };
}

/**
 * Paid trip: create a Connect Checkout Session and a `pending` registration.
 * Confirmation happens in the `payment_intent.succeeded` webhook, never here —
 * a hiker who abandons Checkout must not end up registered.
 */
async function registerPaid(
  userId: string,
  trip: typeof trips.$inferSelect,
  existingPendingId: string | null,
  isReregistration: boolean,
): Promise<RegisterResult> {
  if (!isStripeConfigured()) {
    return { success: false, error: "Pagesat nuk janë konfiguruar ende." };
  }

  const club = await db.query.organizations.findFirst({
    where: eq(organizations.id, trip.organizationId),
    columns: { stripeConnectAccountId: true, stripeAccountStatus: true },
  });
  if (
    !club?.stripeConnectAccountId ||
    club.stripeAccountStatus !== "active"
  ) {
    return {
      success: false,
      error: "Ky klub nuk pranon pagesa online aktualisht.",
    };
  }

  // Refuse to sell the last seat's worth if the trip is already full — paid
  // hikers shouldn't be charged into a waitlist.
  const confirmed = await confirmedCountFor(trip.id);
  if (trip.maxParticipants !== null && confirmed >= trip.maxParticipants) {
    return { success: false, error: "Ky udhëtim është plot." };
  }

  // All money math in integer cents — never float euros.
  const amountCents = Math.round(Number(trip.priceEur) * 100);
  const feeCents = Math.round(amountCents * PLATFORM_FEE_RATE);

  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: { name: trip.title },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: { destination: club.stripeConnectAccountId },
        metadata: {
          tripId: trip.id,
          userId,
          organizationId: trip.organizationId,
        },
      },
      metadata: {
        tripId: trip.id,
        userId,
        organizationId: trip.organizationId,
      },
      success_url: `${env.NEXT_PUBLIC_APP_URL}/trips/${trip.id}?payment=success`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/trips/${trip.id}?payment=canceled`,
    });

    // In `payment` mode the PaymentIntent is created asynchronously by Stripe,
    // so `payment_intent` is typically null on the freshly created session —
    // only `url` is guaranteed here. The webhook fills in the intent id later
    // (it correlates by tripId+userId metadata), so don't block the redirect
    // on an id we can't have yet.
    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : (checkoutSession.payment_intent?.id ?? null);

    if (!checkoutSession.url) {
      return { success: false, error: "Nuk u krijua pagesa. Provoni sërish." };
    }

    if (existingPendingId) {
      // Resume an abandoned attempt — reuse the row (unique trip+user) and
      // point it at the fresh session/intent.
      await db
        .update(tripRegistrations)
        .set({
          status: "pending",
          paymentStatus: "pending",
          stripePaymentIntentId: paymentIntentId,
        })
        .where(eq(tripRegistrations.id, existingPendingId));
    } else {
      await db.insert(tripRegistrations).values({
        tripId: trip.id,
        userId,
        status: "pending",
        paymentStatus: "pending",
        stripePaymentIntentId: paymentIntentId,
        isReregistration,
      });
    }

    trackEvent("trip.payment.started", {
      tripId: trip.id,
      organizationId: trip.organizationId,
      amountCents,
      feeCents,
    });

    return { success: true, type: "paid", checkoutUrl: checkoutSession.url };
  } catch (error) {
    captureError(error, {
      action: "registerForTrip.paid",
      userId,
      extra: { tripId: trip.id, organizationId: trip.organizationId },
    });
    return { success: false, error: "Pagesa dështoi të nisë. Provoni sërish." };
  }
}

/** Count of confirmed registrations for a trip. */
async function confirmedCountFor(tripId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(tripRegistrations)
    .where(
      and(
        eq(tripRegistrations.tripId, tripId),
        eq(tripRegistrations.status, "confirmed"),
      ),
    );
  return row?.value ?? 0;
}

async function sendConfirmation(
  userId: string,
  trip: typeof trips.$inferSelect,
): Promise<void> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true },
    });
    if (!user) return;

    const tripUrl = `${env.NEXT_PUBLIC_APP_URL}/trips/${trip.slug}`;
    await sendEmail({
      to: user.email,
      subject: `Regjistrimi u konfirmua: ${trip.title}`,
      template: TripConfirmation({
        tripTitle: trip.title,
        dateLabel: formatTripDateTime(trip.startDatetime),
        meetingPoint: trip.meetingPoint,
        tripUrl,
        calendarUrl: googleCalendarUrl({
          title: trip.title,
          start: trip.startDatetime,
          end: trip.endDatetime,
          location: trip.meetingPoint ?? undefined,
        }),
      }),
    });
  } catch {
    // Best-effort.
  }
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** Free self-cancellation window: no cancellations inside this many ms before
 * the trip starts. Matches the "free cancellation 24h before" policy. */
const CANCELLATION_CUTOFF_MS = 24 * 60 * 60 * 1000;

/**
 * Hiker: cancel their own registration.
 *
 * Self-cancellation is blocked once the trip is within 24h of starting — the
 * hiker must contact the club. Otherwise a paid registration is refunded in
 * full (reversing the club transfer + HikeIt's fee, as these are destination
 * charges) before the row is canceled.
 */
export async function cancelMyRegistration(
  registrationId: string,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const registration = await db.query.tripRegistrations.findFirst({
    where: and(
      eq(tripRegistrations.id, registrationId),
      eq(tripRegistrations.userId, session.user.id),
    ),
  });
  if (!registration) return { success: false, error: "Nuk u gjet." };
  if (registration.status === "canceled") {
    return { success: false, error: "Ky regjistrim është anuluar tashmë." };
  }
  if (registration.isReregistration) {
    return {
      success: false,
      error:
        "Keni anuluar një herë këtë udhëtim. Për ndihmë kontaktoni klubin direkt.",
    };
  }

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, registration.tripId),
    columns: { slug: true, startDatetime: true },
  });
  if (!trip) return { success: false, error: "Udhëtimi nuk u gjet." };

  // Cancellation deadline: within 24h of the start, self-cancellation is off.
  if (
    trip.startDatetime.getTime() - Date.now() < CANCELLATION_CUTOFF_MS
  ) {
    return {
      success: false,
      error:
        "Anulimi falas mbyllet 24 orë para nisjes. Kontaktoni klubin për ndihmë.",
    };
  }

  // Refund a paid registration before canceling. A payment still pending can't
  // be self-canceled here — there's nothing settled to refund and the webhook
  // may still confirm it.
  if (registration.paymentStatus === "pending") {
    return {
      success: false,
      error:
        "Pagesa ende nuk është konfirmuar. Provoni sërish pasi të përfundojë.",
    };
  }
  if (registration.paymentStatus === "paid") {
    if (!isStripeConfigured() || !registration.stripePaymentIntentId) {
      return {
        success: false,
        error: "Rimbursimi nuk mund të kryhet tani. Provoni sërish më vonë.",
      };
    }
    try {
      await getStripe().refunds.create({
        payment_intent: registration.stripePaymentIntentId,
        reverse_transfer: true,
        refund_application_fee: true,
      });
    } catch (error) {
      captureError(error, {
        action: "cancelMyRegistration.refund",
        userId: session.user.id,
        extra: { registrationId, paymentIntentId: registration.stripePaymentIntentId },
      });
      return {
        success: false,
        error: "Rimbursimi dështoi. Provoni sërish ose kontaktoni klubin.",
      };
    }
  }

  const isPaid = registration.paymentStatus === "paid";
  await db
    .update(tripRegistrations)
    .set({
      status: "canceled",
      paymentStatus: isPaid ? "refunded" : registration.paymentStatus,
      canceledAt: new Date(),
    })
    .where(eq(tripRegistrations.id, registrationId));

  revalidatePath("/dashboard/my-trips");
  revalidatePath(`/trips/${trip.slug}`);
  return { success: true };
}

/** Admin: change a registration's status. */
export async function updateRegistrationStatus(
  registrationId: string,
  status: "confirmed" | "waitlisted" | "canceled",
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const registration = await db.query.tripRegistrations.findFirst({
    where: eq(tripRegistrations.id, registrationId),
  });
  if (!registration) return { success: false, error: "Nuk u gjet." };

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, registration.tripId),
    columns: { organizationId: true, slug: true },
  });
  if (!trip || !(await isClubManager(session.user.id, trip.organizationId))) {
    return { success: false, error: "Nuk keni qasje." };
  }

  await db
    .update(tripRegistrations)
    .set({
      status,
      canceledAt: status === "canceled" ? new Date() : null,
    })
    .where(eq(tripRegistrations.id, registrationId));

  revalidatePath(`/dashboard/club/${trip.slug}`);
  return { success: true };
}

/**
 * Admin: remove a participant from a trip.
 *
 * - Paid registration → refund the Stripe payment in full, mark the row
 *   `canceled`/`refunded`, and notify the hiker (email + in-app).
 * - Free registration → mark `canceled` and notify the hiker.
 * - Pending payment → blocked; the admin must wait for it to resolve, since
 *   there's nothing settled to refund and the webhook may still confirm it.
 *
 * Stripe errors are never surfaced raw — they're caught, logged to Sentry, and
 * mapped to an Albanian message.
 */
export async function removeRegistration(
  registrationId: string,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const registration = await db.query.tripRegistrations.findFirst({
    where: eq(tripRegistrations.id, registrationId),
  });
  if (!registration) return { success: false, error: "Nuk u gjet." };

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, registration.tripId),
    columns: { id: true, title: true, slug: true, organizationId: true },
  });
  if (!trip || !(await isClubManager(session.user.id, trip.organizationId))) {
    return { success: false, error: "Nuk keni qasje." };
  }

  // A payment still in flight has nothing settled to refund and may yet be
  // confirmed by the webhook — don't let the admin remove into that race.
  if (registration.paymentStatus === "pending") {
    return {
      success: false,
      error:
        "Pagesa ende nuk është konfirmuar. Prisni derisa të përfundojë para se ta hiqni.",
    };
  }

  const isPaid = registration.paymentStatus === "paid";

  if (isPaid) {
    if (!isStripeConfigured() || !registration.stripePaymentIntentId) {
      return {
        success: false,
        error: "Rimbursimi nuk mund të kryhet tani. Provoni sërish më vonë.",
      };
    }
    try {
      // These are destination charges (created on the platform account with
      // `transfer_data.destination` + `application_fee_amount`), so the charge
      // and its refund live on the *platform* account — never on the club's
      // connected account. Refund there, and claw the money back out of the
      // club (`reverse_transfer`) and out of HikeIt's fee
      // (`refund_application_fee`) so a full refund isn't paid for by the
      // platform alone.
      await getStripe().refunds.create({
        payment_intent: registration.stripePaymentIntentId,
        reverse_transfer: true,
        refund_application_fee: true,
      });
    } catch (error) {
      captureError(error, {
        action: "removeRegistration.refund",
        userId: session.user.id,
        extra: {
          registrationId,
          tripId: trip.id,
          paymentIntentId: registration.stripePaymentIntentId,
        },
      });
      return {
        success: false,
        error: "Rimbursimi dështoi. Provoni sërish ose kontaktoni mbështetjen.",
      };
    }
  }

  await db
    .update(tripRegistrations)
    .set({
      status: "canceled",
      paymentStatus: isPaid ? "refunded" : registration.paymentStatus,
      canceledAt: new Date(),
    })
    .where(eq(tripRegistrations.id, registrationId));

  const amountLabel = registration.amountPaidEur
    ? `€${Number(registration.amountPaidEur).toFixed(2)}`
    : "€0";

  // In-app notification (best-effort — the removal itself has already committed).
  try {
    await db.insert(notifications).values({
      userId: registration.userId,
      type: "trip",
      title: "Jeni hequr nga udhëtimi",
      body: isPaid
        ? `Klubi ju ka hequr nga udhëtimi. Rimbursimi i ${amountLabel} është në proces.`
        : "Klubi ju ka hequr nga udhëtimi.",
      link: `/trips/${trip.slug}`,
    });
  } catch {
    // Best-effort.
  }

  // Email the hiker (best-effort).
  const removalMessage = isPaid
    ? `Klubi ju ka hequr nga udhëtimi "${trip.title}".\n\nRimbursimi i plotë prej ${amountLabel} do të shfaqet në llogarinë tuaj brenda 5–10 ditësh pune.`
    : `Klubi ju ka hequr nga udhëtimi "${trip.title}".`;
  try {
    const hiker = await db.query.users.findFirst({
      where: eq(users.id, registration.userId),
      columns: { email: true },
    });
    if (hiker?.email) {
      await sendEmail({
        to: hiker.email,
        subject: "Keni qenë hequr nga udhëtimi",
        template: GenericMessage({
          heading: "Keni qenë hequr nga udhëtimi",
          message: removalMessage,
        }),
      });
    }
  } catch {
    // Best-effort.
  }

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: isPaid ? "trip.registration.refunded" : "trip.registration.removed",
    entityType: "trip",
    entityId: trip.id,
    metadata: {
      registrationId,
      hikerId: registration.userId,
      ...(isPaid
        ? {
            amountEur: Number(registration.amountPaidEur ?? 0),
            paymentIntentId: registration.stripePaymentIntentId,
          }
        : {}),
    },
  });

  revalidatePath(`/dashboard/club/${trip.slug}`);
  revalidatePath(`/dashboard/club/${trip.slug}/trips/${trip.slug}`);
  return { success: true };
}

/** Admin: cancel a whole trip and email every registrant the reason. */
export async function cancelTrip(
  tripId: string,
  reason: string,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) return { success: false, error: "Udhëtimi nuk u gjet." };
  if (!(await isClubManager(session.user.id, trip.organizationId))) {
    return { success: false, error: "Nuk keni qasje." };
  }

  await db
    .update(trips)
    .set({ status: "canceled", canceledReason: reason })
    .where(eq(trips.id, tripId));

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "trip.canceled",
    entityType: "trip",
    entityId: tripId,
  });

  void emailRegistrants(
    tripId,
    `Udhëtimi u anulua: ${trip.title}`,
    TripCancellation({
      tripTitle: trip.title,
      reason,
      tripsUrl: `${env.NEXT_PUBLIC_APP_URL}/trips`,
    }),
  );

  revalidatePath(`/trips/${trip.slug}`);
  return { success: true };
}

export interface EmailResult extends ActionResult {
  sentCount?: number;
}

/** Admin: broadcast a free-form message to every registrant of a trip. */
export async function emailTripRegistrants(
  tripId: string,
  subject: string,
  message: string,
): Promise<EmailResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    columns: { organizationId: true },
  });
  if (!trip || !(await isClubManager(session.user.id, trip.organizationId))) {
    return { success: false, error: "Nuk keni qasje." };
  }

  const sent = await emailRegistrants(
    tripId,
    subject,
    GenericMessage({ heading: subject, message }),
  );
  return { success: true, sentCount: sent };
}

/** Send a template to every non-canceled registrant. Returns count attempted. */
async function emailRegistrants(
  tripId: string,
  subject: string,
  template: ReactElement,
): Promise<number> {
  try {
    const recipients = await db
      .select({ email: users.email })
      .from(tripRegistrations)
      .innerJoin(users, eq(users.id, tripRegistrations.userId))
      .where(
        and(
          eq(tripRegistrations.tripId, tripId),
          ne(tripRegistrations.status, "canceled"),
        ),
      );

    await Promise.allSettled(
      recipients.map((r) =>
        sendEmail({ to: r.email, subject, template }),
      ),
    );
    return recipients.length;
  } catch {
    return 0;
  }
}
