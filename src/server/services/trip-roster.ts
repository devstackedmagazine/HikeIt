import { and, asc, count, eq, inArray, ne } from "drizzle-orm";

import { env } from "@/config/env";
import { db } from "@/lib/db";
import { tripRegistrations, trips, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { TripConfirmation } from "@/lib/email/templates/trip-confirmation";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import {
  rosterStatus,
  waitlistPromotions,
} from "@/lib/trips/registration-rules";
import { formatTripDateTime, googleCalendarUrl } from "@/lib/utils/datetime";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Read the trip and hold a row lock on it until the transaction ends. Every
 * roster change that reads the confirmed count and then writes takes this
 * lock first, so two admins acting at once are serialized instead of both
 * seeing the last free spot.
 */
export async function lockTrip(tx: Tx, tripId: string) {
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

export type LockedTrip = NonNullable<Awaited<ReturnType<typeof lockTrip>>>;

/**
 * Call under the trip's row lock after a confirmed spot was freed or the
 * limit was raised. Confirms the oldest waitlisted registrations into the
 * free spots (never past the limit) and keeps `open` / `full` in step with
 * the confirmed count. `skipRegistrationId` is the row an organiser has just
 * moved to the waitlist by hand — promoting it straight back would undo that.
 *
 * Returns the promoted hikers' user ids; email them after the commit.
 */
export async function promoteFromWaitlist(
  tx: Tx,
  trip: LockedTrip,
  skipRegistrationId?: string,
): Promise<string[]> {
  const started = trip.startDatetime <= new Date();
  const [row] = await tx
    .select({ value: count() })
    .from(tripRegistrations)
    .where(
      and(
        eq(tripRegistrations.tripId, trip.id),
        eq(tripRegistrations.status, "confirmed"),
      ),
    );
  const confirmed = row?.value ?? 0;

  const waiting = await tx
    .select({ id: tripRegistrations.id })
    .from(tripRegistrations)
    .where(
      and(
        eq(tripRegistrations.tripId, trip.id),
        eq(tripRegistrations.status, "waitlisted"),
        skipRegistrationId
          ? ne(tripRegistrations.id, skipRegistrationId)
          : undefined,
      ),
    )
    .orderBy(asc(tripRegistrations.registeredAt), asc(tripRegistrations.id));

  const take = waitlistPromotions({
    status: trip.status,
    started,
    maxParticipants: trip.maxParticipants,
    confirmed,
    waitlisted: waiting.length,
  });
  const promoted =
    take === 0
      ? []
      : await tx
          .update(tripRegistrations)
          .set({ status: "confirmed" })
          .where(
            and(
              inArray(
                tripRegistrations.id,
                waiting.slice(0, take).map((w) => w.id),
              ),
              // Still waiting: an account deletion doesn't take the trip lock.
              eq(tripRegistrations.status, "waitlisted"),
            ),
          )
          .returning({ userId: tripRegistrations.userId });

  const next = rosterStatus({
    status: trip.status,
    started,
    maxParticipants: trip.maxParticipants,
    confirmed: confirmed + promoted.length,
  });
  if (next !== trip.status) {
    await tx.update(trips).set({ status: next }).where(eq(trips.id, trip.id));
  }
  return promoted.map((p) => p.userId);
}

/**
 * Tell each promoted hiker they now have a spot. Best-effort, after commit.
 * The email carries only the trip's own details.
 */
export async function emailPromoted(
  userIds: string[],
  tripId: string,
): Promise<void> {
  if (userIds.length === 0) return;
  try {
    const trip = await db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      columns: {
        title: true,
        slug: true,
        startDatetime: true,
        endDatetime: true,
        meetingPoint: true,
      },
    });
    if (!trip) return;
    const recipients = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.id, userIds));

    for (const recipient of recipients) {
      // Keyed on the recipient: however often they are moved on and off the
      // waitlist, only a few of these reach their inbox.
      const limited = await enforceRateLimit(
        "ratelimit.trip.waitlist_promoted",
        { userId: recipient.id },
      );
      if (limited) continue;
      await sendEmail({
        to: recipient.email,
        subject: `U lirua një vend: ${trip.title}`,
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
          fromWaitlist: true,
        }),
      }).catch(() => undefined);
    }
  } catch {
    // Best-effort.
  }
}
