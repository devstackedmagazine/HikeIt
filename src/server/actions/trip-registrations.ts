"use server";

import { and, count, eq, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ReactElement } from "react";

import { env } from "@/config/env";
import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  auditLogs,
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
  /** "free" → confirmed/waitlisted directly; "paid" → pay via clientSecret. */
  type?: "free" | "paid";
  status?: "confirmed" | "waitlisted";
  /** Present when `type === "paid"`: pass to Stripe Elements to collect payment. */
  clientSecret?: string;
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
 * - Paid trip: creates a Stripe PaymentIntent routed to the club's Connect
 *   account with HikeIt's 2.5% application fee, records a `pending`
 *   registration, and returns `{ type: "paid", clientSecret }` for the client
 *   to complete with Stripe Elements. The webhook confirms it on success.
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

  const price = Number(trip.priceEur ?? 0);
  return price > 0
    ? registerPaid(session.user.id, trip, existing?.id ?? null)
    : registerFree(session.user.id, trip);
}

/** Free trip: confirm (or waitlist), email, revalidate. */
async function registerFree(
  userId: string,
  trip: typeof trips.$inferSelect,
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
 * Paid trip: create a Connect PaymentIntent and a `pending` registration.
 * Confirmation happens in the `payment_intent.succeeded` webhook, never here —
 * a client that abandons the payment form must not end up registered.
 */
async function registerPaid(
  userId: string,
  trip: typeof trips.$inferSelect,
  existingPendingId: string | null,
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
    const intent = await getStripe().paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      application_fee_amount: feeCents,
      transfer_data: { destination: club.stripeConnectAccountId },
      metadata: {
        tripId: trip.id,
        userId,
        organizationId: trip.organizationId,
      },
      automatic_payment_methods: { enabled: true },
    });

    if (!intent.client_secret) {
      return { success: false, error: "Nuk u krijua pagesa. Provoni sërish." };
    }

    if (existingPendingId) {
      // Resume an abandoned attempt — reuse the row (unique trip+user) and
      // point it at the fresh intent.
      await db
        .update(tripRegistrations)
        .set({
          status: "pending",
          paymentStatus: "pending",
          stripePaymentIntentId: intent.id,
        })
        .where(eq(tripRegistrations.id, existingPendingId));
    } else {
      await db.insert(tripRegistrations).values({
        tripId: trip.id,
        userId,
        status: "pending",
        paymentStatus: "pending",
        stripePaymentIntentId: intent.id,
      });
    }

    trackEvent("trip.payment.started", {
      tripId: trip.id,
      organizationId: trip.organizationId,
      amountCents,
      feeCents,
    });

    return { success: true, type: "paid", clientSecret: intent.client_secret };
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

/** Hiker: cancel their own registration. */
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

  await db
    .update(tripRegistrations)
    .set({ status: "canceled", canceledAt: new Date() })
    .where(eq(tripRegistrations.id, registrationId));

  revalidatePath("/dashboard/my-trips");
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
