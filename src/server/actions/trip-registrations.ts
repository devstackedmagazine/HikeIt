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
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { GenericMessage } from "@/lib/email/templates/generic-message";
import { TripCancellation } from "@/lib/email/templates/trip-cancellation";
import { TripConfirmation } from "@/lib/email/templates/trip-confirmation";
import {
  formatTripDateTime,
  googleCalendarUrl,
} from "@/lib/utils/datetime";

export interface RegisterResult {
  success: boolean;
  status?: "confirmed" | "waitlisted";
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

/** Register the current user for a trip (confirmed, or waitlisted if full). */
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
  if (existing) {
    return { success: false, error: "Jeni tashmë i regjistruar." };
  }

  const [confirmedCount] = await db
    .select({ value: count() })
    .from(tripRegistrations)
    .where(
      and(
        eq(tripRegistrations.tripId, tripId),
        eq(tripRegistrations.status, "confirmed"),
      ),
    );

  const confirmed = confirmedCount?.value ?? 0;
  const isFull =
    trip.maxParticipants !== null && confirmed >= trip.maxParticipants;
  const status = isFull ? "waitlisted" : "confirmed";

  await db.insert(tripRegistrations).values({
    tripId,
    userId: session.user.id,
    status,
    paymentStatus: "free",
  });

  // Flip the trip to "full" once this confirmed seat takes the last slot.
  if (
    status === "confirmed" &&
    trip.maxParticipants !== null &&
    confirmed + 1 >= trip.maxParticipants
  ) {
    await db.update(trips).set({ status: "full" }).where(eq(trips.id, tripId));
  }

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "trip.registered",
    entityType: "trip",
    entityId: tripId,
    metadata: { organizationId: trip.organizationId, status },
  });

  if (status === "confirmed") {
    void sendConfirmation(session.user.id, trip);
  }

  revalidatePath(`/trips/${trip.slug}`);
  revalidatePath("/dashboard/my-trips");
  return { success: true, status };
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
