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
 *   can't jump the queue. The organiser confirms from the waitlist.
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
