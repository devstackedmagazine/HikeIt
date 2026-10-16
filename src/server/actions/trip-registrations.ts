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
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { GenericMessage } from "@/lib/email/templates/generic-message";
import { TripCancellation } from "@/lib/email/templates/trip-cancellation";
import { TripConfirmation } from "@/lib/email/templates/trip-confirmation";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { trackEvent } from "@/lib/sentry";
import {
  formatTripDateTime,
  googleCalendarUrl,
} from "@/lib/utils/datetime";


/**
 * Views that change when a club edits a trip's roster: every club dashboard
 * page (by route pattern — the paths were previously built with the trip's
 * slug in place of the club's, so they matched nothing), the club home at
 * /dashboard (sign-up counts, recent registrations), and the public trip
 * page (spots left).
 */
function revalidateClubRosterViews(tripSlug: string) {
  revalidatePath("/dashboard/club/[slug]", "layout");
  revalidatePath("/dashboard");
  revalidatePath(`/trips/${tripSlug}`);
}
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

/**
 * Register the current user for a trip.
 *
 * Registration is always free at the platform level — HikeIt does not process
 * trip money. A trip's `priceEur` is what the club collects from the hiker
 * directly, however the two of them arrange it; it is displayed for
 * information and never gates registration. The hiker is confirmed
 * immediately, or waitlisted if the trip is already full.
 */
export async function registerForTrip(
  tripId: string,
  acceptedWaiver = false,
): Promise<RegisterResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  // Liability waiver is a precondition, enforced server-side — the client
  // checkbox is a UX affordance, not the control. The acceptance timestamp is
  // recorded on the registration row (`waiverSignedAt`) as proof of consent.
  if (!acceptedWaiver) {
    return {
      success: false,
      error:
        "Duhet të pranoni kushtet dhe rreziqet e aktivitetit para regjistrimit.",
    };
  }

  const limited = await enforceRateLimit("ratelimit.trip.register", {
    userId: session.user.id,
  });
  if (limited) return { success: false, error: limited };

  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) return { success: false, error: "Udhëtimi nuk u gjet." };
  if (trip.status !== "open") {
    return { success: false, error: "Ky udhëtim nuk është i hapur." };
  }
  // The cron only completes a trip hours after it ends, so `open` alone
  // would still accept sign-ups once the group has left.
  if (trip.startDatetime <= new Date()) {
    return { success: false, error: "Ky udhëtim ka filluar." };
  }

  const existing = await db.query.tripRegistrations.findFirst({
    where: and(
      eq(tripRegistrations.tripId, tripId),
      eq(tripRegistrations.userId, session.user.id),
      ne(tripRegistrations.status, "canceled"),
    ),
    orderBy: (t, { desc }) => [desc(t.registeredAt)],
  });
  if (existing) return { success: false, error: "Jeni tashmë i regjistruar." };

  // A prior cancellation is still recorded (`isReregistration`) so the club
  // can see churn on its roster, but it no longer blocks anyone: with no money
  // moving there is nothing to cycle, and refusing an honest hiker who changed
  // their mind twice is friction for its own sake.
  const canceled = await db.query.tripRegistrations.findFirst({
    where: and(
      eq(tripRegistrations.tripId, tripId),
      eq(tripRegistrations.userId, session.user.id),
      eq(tripRegistrations.status, "canceled"),
    ),
    columns: { id: true },
  });

  return createRegistration(session.user.id, trip, canceled != null);
}

/** Confirm (or waitlist) the hiker, email them, revalidate. */
async function createRegistration(
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
    isReregistration,
    waiverSignedAt: new Date(),
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

  trackEvent("trip.registered", {
    tripId: trip.id,
    organizationId: trip.organizationId,
    status,
  });

  if (status === "confirmed") void sendConfirmation(userId, trip);

  revalidatePath(`/trips/${trip.slug}`);
  revalidatePath("/dashboard/my-trips");
  return { success: true, status };
}

/** Count of confirmed registrations for a trip. */
async function confirmedCountFor(
  tripId: string,
  executor: Pick<typeof db, "select"> = db,
): Promise<number> {
  const [row] = await executor
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

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Read the trip and hold a row lock on it until the transaction ends. Every
 * roster change that reads the confirmed count and then writes takes this
 * lock first, so two admins acting at once are serialized instead of both
 * seeing the last free spot.
 */
async function lockTrip(tx: Tx, tripId: string) {
  const [trip] = await tx
    .select({
      id: trips.id,
      status: trips.status,
      startDatetime: trips.startDatetime,
      maxParticipants: trips.maxParticipants,
    })
    .from(trips)
    .where(eq(trips.id, tripId))
    .for("update");
  return trip;
}

/**
 * After a registration has left `confirmed`, put a trip marked full back to
 * open — but only if a spot really is free now and the trip hasn't started.
 * A full trip refuses new sign-ups, so without this it stays closed forever.
 */
async function reopenIfSpotFreed(
  tx: Tx,
  trip: NonNullable<Awaited<ReturnType<typeof lockTrip>>>,
): Promise<void> {
  if (trip.status !== "full" || trip.startDatetime <= new Date()) return;
  if (trip.maxParticipants !== null) {
    const confirmed = await confirmedCountFor(trip.id, tx);
    if (confirmed >= trip.maxParticipants) return;
  }
  await tx.update(trips).set({ status: "open" }).where(eq(trips.id, trip.id));
}

/** Postgres unique_violation, unwrapped from Drizzle's query error if needed. */
function isUniqueViolation(error: unknown): boolean {
  const code =
    (error as { code?: string })?.code ??
    (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

const ALREADY_ACTIVE_ERROR =
  "Ky person ka tashmë një regjistrim aktiv në këtë udhëtim. Menaxhoni atë regjistrim në vend të këtij të anuluar.";

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

/**
 * Hiker: cancel their own registration.
 *
 * Open right up until the trip starts. The old 24h cutoff existed to protect
 * refunds; with no money moving it only converted cancellations into no-shows,
 * which is strictly worse for the club — a no-show keeps the seat blocked,
 * where a late cancellation at least frees it for the waitlist.
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

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, registration.tripId),
    columns: { slug: true },
  });
  if (!trip) return { success: false, error: "Udhëtimi nuk u gjet." };

  await db.transaction(async (tx) => {
    const locked = await lockTrip(tx, registration.tripId);
    const current = await tx.query.tripRegistrations.findFirst({
      where: eq(tripRegistrations.id, registrationId),
      columns: { status: true },
    });

    await tx
      .update(tripRegistrations)
      .set({ status: "canceled", canceledAt: new Date() })
      .where(eq(tripRegistrations.id, registrationId));

    if (locked && current?.status === "confirmed") {
      await reopenIfSpotFreed(tx, locked);
    }
  });

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "trip.registration.canceled",
    entityType: "trip",
    entityId: registration.tripId,
    metadata: { registrationId },
  });

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

  let result: ActionResult;
  try {
    result = await db.transaction(async (tx): Promise<ActionResult> => {
      const locked = await lockTrip(tx, registration.tripId);
      if (!locked) return { success: false, error: "Udhëtimi nuk u gjet." };

      // Re-read under the lock: another admin may have changed this row
      // between the read above and the lock being granted.
      const current = await tx.query.tripRegistrations.findFirst({
        where: eq(tripRegistrations.id, registrationId),
        columns: { status: true, userId: true },
      });
      if (!current) return { success: false, error: "Nuk u gjet." };
      if (current.status === status) return { success: true };

      // Reviving a canceled row would collide with the one-active-row
      // unique index if the hiker has since registered again.
      if (current.status === "canceled") {
        const active = await tx.query.tripRegistrations.findFirst({
          where: and(
            eq(tripRegistrations.tripId, locked.id),
            eq(tripRegistrations.userId, current.userId),
            ne(tripRegistrations.status, "canceled"),
          ),
          columns: { id: true },
        });
        if (active) return { success: false, error: ALREADY_ACTIVE_ERROR };
      }

      const confirmed =
        status === "confirmed" ? await confirmedCountFor(locked.id, tx) : 0;
      if (
        status === "confirmed" &&
        locked.maxParticipants !== null &&
        confirmed >= locked.maxParticipants
      ) {
        return {
          success: false,
          error: `Udhëtimi është plot: ${confirmed} nga ${locked.maxParticipants} vende janë të konfirmuara. Hiqni një pjesëmarrës para se të konfirmoni një tjetër.`,
        };
      }

      await tx
        .update(tripRegistrations)
        .set({
          status,
          canceledAt: status === "canceled" ? new Date() : null,
        })
        .where(eq(tripRegistrations.id, registrationId));

      if (status === "confirmed") {
        // Same rule as self-registration: taking the last spot fills the trip.
        if (
          locked.status === "open" &&
          locked.maxParticipants !== null &&
          confirmed + 1 >= locked.maxParticipants
        ) {
          await tx
            .update(trips)
            .set({ status: "full" })
            .where(eq(trips.id, locked.id));
        }
      } else if (current.status === "confirmed") {
        await reopenIfSpotFreed(tx, locked);
      }

      return { success: true };
    });
  } catch (error) {
    // The pre-check above runs under the trip lock, but self-registration
    // doesn't take that lock, so a hiker can still re-register in between.
    if (isUniqueViolation(error)) {
      return { success: false, error: ALREADY_ACTIVE_ERROR };
    }
    throw error;
  }

  if (result.success) revalidateClubRosterViews(trip.slug);
  return result;
}

/**
 * Admin: remove a participant from a trip.
 *
 * A plain removal now — the row is marked `canceled` and the hiker is told.
 * There is no refund to issue: any money for this trip was arranged between
 * the hiker and the club directly, so settling up is theirs to do.
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

  await db.transaction(async (tx) => {
    const locked = await lockTrip(tx, trip.id);
    const current = await tx.query.tripRegistrations.findFirst({
      where: eq(tripRegistrations.id, registrationId),
      columns: { status: true },
    });

    await tx
      .update(tripRegistrations)
      .set({ status: "canceled", canceledAt: new Date() })
      .where(eq(tripRegistrations.id, registrationId));

    if (locked && current?.status === "confirmed") {
      await reopenIfSpotFreed(tx, locked);
    }
  });

  // In-app notification (best-effort — the removal itself has already committed).
  try {
    await db.insert(notifications).values({
      userId: registration.userId,
      type: "trip",
      title: "Jeni hequr nga udhëtimi",
      body: "Klubi ju ka hequr nga udhëtimi.",
      link: `/trips/${trip.slug}`,
    });
  } catch {
    // Best-effort.
  }

  // Email the hiker (best-effort).
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
          message: `Klubi ju ka hequr nga udhëtimi "${trip.title}".`,
        }),
      });
    }
  } catch {
    // Best-effort.
  }

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "trip.registration.removed",
    entityType: "trip",
    entityId: trip.id,
    metadata: { registrationId, hikerId: registration.userId },
  });

  revalidateClubRosterViews(trip.slug);
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
