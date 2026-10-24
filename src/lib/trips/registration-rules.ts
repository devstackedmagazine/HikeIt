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
 * - at or over capacity → waitlisted, whatever the stored status says.
 */
export function decideSignUp(input: {
  status: Trip["status"];
  maxParticipants: number | null;
  confirmed: number;
}): SignUpDecision {
  const { status, maxParticipants, confirmed } = input;
  if (status !== "open" && status !== "full") return { kind: "closed" };
  if (maxParticipants === null) return { kind: "confirmed", fillsTrip: false };
  if (confirmed >= maxParticipants) return { kind: "waitlisted" };
  return { kind: "confirmed", fillsTrip: confirmed + 1 >= maxParticipants };
}
