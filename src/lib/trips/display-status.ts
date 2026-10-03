import type { Trip } from "@/lib/db/schema";

/**
 * When a trip counts as over. Shared by the complete-trips cron (the real
 * status write) and every place that displays a status, so a trip the cron
 * hasn't reached yet already reads as completed instead of "Hapur".
 */

/** Grace period after a trip's stated end time before it counts as over. */
export const END_GRACE_MINUTES = 90;

/** Assumed duration for a trip that never declared an end time. */
export const NO_END_DURATION_HOURS = 12;

/** Latest `end_datetime` / `start_datetime` that count as over at `now`. */
export function tripOverCutovers(now: Date): {
  endCutover: Date;
  startCutover: Date;
} {
  return {
    endCutover: new Date(now.getTime() - END_GRACE_MINUTES * 60 * 1000),
    startCutover: new Date(
      now.getTime() - NO_END_DURATION_HOURS * 60 * 60 * 1000,
    ),
  };
}

type TripTimes = Pick<Trip, "status" | "startDatetime" | "endDatetime">;

/** Whether the trip's time is past the cutover, regardless of status. */
export function isTripOver(trip: TripTimes, now: Date = new Date()): boolean {
  const { endCutover, startCutover } = tripOverCutovers(now);
  return trip.endDatetime
    ? trip.endDatetime <= endCutover
    : trip.startDatetime <= startCutover;
}

/**
 * The status to show: `open` and `full` trips that are over read as
 * `completed`. Every other status is shown as stored. Display only — the
 * cron job remains the real update.
 */
export function displayTripStatus(
  trip: TripTimes,
  now: Date = new Date(),
): Trip["status"] {
  if (
    (trip.status === "open" || trip.status === "full") &&
    isTripOver(trip, now)
  ) {
    return "completed";
  }
  return trip.status;
}
