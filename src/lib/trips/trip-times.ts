/**
 * Server-side rules for a trip's start/end, on real instants (already read as
 * Kosovo time by `fromKosovoWallTime`). Comparing instants is the same as
 * comparing Kosovo wall times, so "in the past" means past in Kosovo.
 */

export const PAST_START_ERROR =
  "Data e nisjes nuk mund të jetë në të kaluarën. Zgjidhni një datë dhe orë të ardhshme.";
export const END_BEFORE_START_ERROR =
  "Mbarimi duhet të jetë pas nisjes. Kontrolloni datën dhe orën e mbarimit.";

const MINUTE_MS = 60 * 1000;

/**
 * `storedStart` is the trip's current start when editing. A past start is
 * only rejected if the start actually changes, so a trip that has already
 * started can still have its other fields edited. Compared to the minute:
 * the form carries no seconds. New trips (no `storedStart`) can never start
 * in the past. End at or before start is always rejected.
 */
export function tripTimesError(
  times: { start: Date; end: Date | null },
  now: Date = new Date(),
  storedStart?: Date,
): string | null {
  const startChanged =
    !storedStart ||
    Math.floor(storedStart.getTime() / MINUTE_MS) !==
      Math.floor(times.start.getTime() / MINUTE_MS);
  if (startChanged && times.start.getTime() < now.getTime()) {
    return PAST_START_ERROR;
  }
  if (times.end && times.end.getTime() <= times.start.getTime()) {
    return END_BEFORE_START_ERROR;
  }
  return null;
}
