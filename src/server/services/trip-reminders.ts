import { and, between, eq, inArray } from "drizzle-orm";

import { env } from "@/config/env";
import { db } from "@/lib/db";
import {
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { TripReminder } from "@/lib/email/templates/trip-reminder";
import { tripStatusLabels } from "@/lib/i18n/labels";
import { formatTripDateTime } from "@/lib/utils/datetime";

export interface ReminderResult {
  tripsReminded: number;
  emailsSent: number;
  errors: string[];
}

const ALERT_NOTE: Record<string, string> = {
  warning: "Kushte të pafavorshme moti — kini kujdes.",
  alert: "Kushte të rrezikshme moti — rivlerësoni udhëtimin.",
  danger: "RREZIK moti — udhëtimi mund të anulohet.",
};

/** Email confirmed registrants of trips starting in ~24h and ~2h. */
export async function runTripReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    tripsReminded: 0,
    emailsSent: 0,
    errors: [],
  };

  await remindWindow(24, false, result);
  await remindWindow(2, true, result);

  return result;
}

async function remindWindow(
  hoursAhead: number,
  urgent: boolean,
  result: ReminderResult,
): Promise<void> {
  const now = Date.now();
  const center = now + hoursAhead * 60 * 60 * 1000;
  const from = new Date(center - 30 * 60 * 1000);
  const to = new Date(center + 30 * 60 * 1000);

  const dueTrips = await db
    .select()
    .from(trips)
    .where(
      and(
        inArray(trips.status, ["open", "full"]),
        between(trips.startDatetime, from, to),
      ),
    );

  for (const trip of dueTrips) {
    result.tripsReminded++;
    const registrants = await db
      .select({ email: users.email })
      .from(tripRegistrations)
      .innerJoin(users, eq(users.id, tripRegistrations.userId))
      .where(
        and(
          eq(tripRegistrations.tripId, trip.id),
          eq(tripRegistrations.status, "confirmed"),
        ),
      );

    const weatherNote =
      trip.weatherAlertLevel !== "clear"
        ? (ALERT_NOTE[trip.weatherAlertLevel] ??
          tripStatusLabels[trip.weatherAlertLevel])
        : null;

    const tripUrl = `${env.NEXT_PUBLIC_APP_URL}/trips/${trip.slug}`;
    const dateLabel = formatTripDateTime(trip.startDatetime);

    const sends = await Promise.allSettled(
      registrants.map((r) =>
        sendEmail({
          to: r.email,
          subject: urgent
            ? `Së shpejti: ${trip.title}`
            : `Kujtesë: ${trip.title} nesër`,
          template: TripReminder({
            tripName: trip.title,
            dateLabel,
            meetingPoint: trip.meetingPoint,
            tripUrl,
            weatherNote,
            urgent,
          }),
        }),
      ),
    );
    result.emailsSent += sends.filter((s) => s.status === "fulfilled").length;
  }
}
