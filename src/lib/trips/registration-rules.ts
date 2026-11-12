import type { Trip } from "@/lib/db/schema";

export type SignUpDecision =
  | { kind: "closed" }
  | { kind: "confirmed"; fillsTrip: boolean }
  | { kind: "waitlisted" };

/**
 * What a new self-registration becomes. Pure, so the capacity rules can be
 * checked without a database (`scripts/check-registration-rules.ts`); the
 * caller must pass a `confirmed` count read under the trip's row lock.
 *
 * - only `open` and `full` trips take sign-ups;
 * - below capacity (or no limit) → confirmed, and taking the last spot
 *   fills the trip;
 * - at or over capacity → waitlisted, whatever the stored status says;
 * - a freed spot goes to the people already waiting: while anyone is on the
 *   waitlist a new sign-up joins it, so cancelling and signing up again
 *   can't jump the queue. `waitlistPromotions` moves them up.
 */
export function decideSignUp(input: {
  status: Trip["status"];
  maxParticipants: number | null;
  confirmed: number;
  waitlisted: number;
}): SignUpDecision {
  const { status, maxParticipants, confirmed, waitlisted } = input;
  if (status !== "open" && status !== "full") return { kind: "closed" };
  if (maxParticipants === null) return { kind: "confirmed", fillsTrip: false };
  if (confirmed >= maxParticipants || waitlisted > 0) {
    return { kind: "waitlisted" };
  }
  return { kind: "confirmed", fillsTrip: confirmed + 1 >= maxParticipants };
}

/**
 * A hiker may cancel their own registration until the trip starts. After
 * that the roster is the organiser's record of who came, and only they change
 * it. Start times are real instants, so "started" means started in Kosovo.
 */
export function hikerCanCancel(startDatetime: Date, now: Date): boolean {
  return now.getTime() < startDatetime.getTime();
}

export const CANCEL_AFTER_START_ERROR =
  "Udhëtimi ka filluar, prandaj regjistrimi nuk mund të anulohet më. Për çdo ndryshim, ju lutemi kontaktoni organizatorin e klubit.";

type RosterInput = {
  status: Trip["status"];
  /** The trip's start has passed. */
  started: boolean;
  maxParticipants: number | null;
  confirmed: number;
};

/**
 * How many waitlisted registrations to confirm, oldest first, once a
 * confirmed spot is freed or the limit is raised. Only into spots that are
 * really free, so the confirmed count never passes the limit; none once the
 * trip has started or stopped taking people.
 */
export function waitlistPromotions(
  input: RosterInput & { waitlisted: number },
): number {
  const { status, started, maxParticipants, confirmed, waitlisted } = input;
  if ((status !== "open" && status !== "full") || started) return 0;
  const free =
    maxParticipants === null ? waitlisted : maxParticipants - confirmed;
  return Math.max(0, Math.min(free, waitlisted));
}

/**
 * `open` / `full` follows the confirmed count. Other statuses, and a trip
 * that has started, are left as they are.
 */
export function rosterStatus(input: RosterInput): Trip["status"] {
  const { status, started, maxParticipants, confirmed } = input;
  if ((status !== "open" && status !== "full") || started) return status;
  return maxParticipants !== null && confirmed >= maxParticipants
    ? "full"
    : "open";
}

/**
 * The statuses an organiser may set by hand. The action's TypeScript type
 * doesn't exist at runtime: without this check a crafted call could write
 * `attended` on a waitlisted row, skipping the capacity check.
 */
export const ADMIN_SETTABLE_STATUSES = [
  "confirmed",
  "waitlisted",
  "canceled",
] as const;

export function isAdminSettableStatus(
  status: unknown,
): status is (typeof ADMIN_SETTABLE_STATUSES)[number] {
  return (ADMIN_SETTABLE_STATUSES as readonly unknown[]).includes(status);
}
