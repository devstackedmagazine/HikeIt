import type { Trip, TripRegistration } from "@/lib/db/schema";
import { NO_END_DURATION_HOURS } from "@/lib/trips/display-status";

/**
 * When a club's organisers may see a participant's phone and emergency
 * contact: from 3 days before the trip starts until 2 days after it ends.
 * A trip with no end time is taken to end `NO_END_DURATION_HOURS` after it
 * starts, same as everywhere else that needs an end.
 *
 * Pure, so the rule can be checked without a database; the server query in
 * `@/server/queries/trip-contacts` is what actually enforces it.
 */

export const CONTACT_WINDOW_DAYS_BEFORE = 3;
export const CONTACT_WINDOW_DAYS_AFTER = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

type TripTimes = Pick<Trip, "startDatetime" | "endDatetime">;

export function contactWindow(trip: TripTimes): {
  opensAt: Date;
  closesAt: Date;
} {
  const end =
    trip.endDatetime ??
    new Date(
      trip.startDatetime.getTime() + NO_END_DURATION_HOURS * 60 * 60 * 1000,
    );
  return {
    opensAt: new Date(
      trip.startDatetime.getTime() - CONTACT_WINDOW_DAYS_BEFORE * DAY_MS,
    ),
    closesAt: new Date(end.getTime() + CONTACT_WINDOW_DAYS_AFTER * DAY_MS),
  };
}

export type ContactAccessDenial =
  | "not-organiser"
  | "trip-not-active"
  | "before-window"
  | "after-window";

/**
 * Whether the viewer may see contact details for this trip at all. Per-row,
 * only approved registrations are ever included (see
 * `CONTACT_VISIBLE_STATUSES`).
 */
export function contactAccess(input: {
  viewerRole: "admin" | "organizer" | "member" | null;
  trip: TripTimes & Pick<Trip, "status">;
  now: Date;
}): { allowed: true } | { allowed: false; reason: ContactAccessDenial } {
  const { viewerRole, trip, now } = input;
  if (viewerRole !== "admin" && viewerRole !== "organizer") {
    return { allowed: false, reason: "not-organiser" };
  }
  // Nobody hikes on a draft or a canceled trip, so there's no safety reason.
  if (trip.status === "draft" || trip.status === "canceled") {
    return { allowed: false, reason: "trip-not-active" };
  }
  const { opensAt, closesAt } = contactWindow(trip);
  if (now < opensAt) return { allowed: false, reason: "before-window" };
  if (now > closesAt) return { allowed: false, reason: "after-window" };
  return { allowed: true };
}

/**
 * Registration statuses whose contact details are shown: approved ones.
 * `attended` and `no_show` are approved registrations after the organiser
 * marks attendance, which happens inside the window. `pending`, `waitlisted`
 * and `canceled` are never shown.
 */
export const CONTACT_VISIBLE_STATUSES = [
  "confirmed",
  "attended",
  "no_show",
] as const satisfies readonly TripRegistration["status"][];

export function contactVisibleForStatus(
  status: TripRegistration["status"],
): boolean {
  return (CONTACT_VISIBLE_STATUSES as readonly string[]).includes(status);
}
