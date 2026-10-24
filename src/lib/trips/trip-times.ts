/**
 * Server-side rules for a trip's start/end, on real instants (already read as
 * Kosovo time by `fromKosovoWallTime`). Comparing instants is the same as
 * comparing Kosovo wall times, so "in the past" means past in Kosovo.
 */

export const PAST_START_ERROR =
  "Data e nisjes nuk mund të jetë në të kaluarën. Zgjidhni një datë dhe orë të ardhshme.";
export const END_BEFORE_START_ERROR =
  "Mbarimi duhet të jetë pas nisjes. Kontrolloni datën dhe orën e mbarimit.";

export function tripTimesError(
  times: { start: Date; end: Date | null },
  now: Date = new Date(),
): string | null {
  if (times.start.getTime() < now.getTime()) return PAST_START_ERROR;
  if (times.end && times.end.getTime() <= times.start.getTime()) {
    return END_BEFORE_START_ERROR;
  }
  return null;
}
