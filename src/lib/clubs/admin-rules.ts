import type { User } from "@/lib/db/schema";

/**
 * Would this change leave the club with no active admin? Pure, so the rule
 * can be checked without a database (`scripts/check-admin-rules.ts`); the
 * caller must pass admin ids read under a lock on those rows.
 *
 * `staysAdmin` is true only when the target keeps (or is given) the admin
 * role; a demotion or a removal is false.
 */
export function leavesClubWithoutAdmin(input: {
  activeAdminIds: readonly string[];
  targetId: string;
  staysAdmin: boolean;
}): boolean {
  const { activeAdminIds, targetId, staysAdmin } = input;
  if (staysAdmin || !activeAdminIds.includes(targetId)) return false;
  return activeAdminIds.length <= 1;
}

/**
 * The role a user holds after picking "hiker" or "club" in onboarding. A
 * super admin keeps their role whatever they pick: these actions can be
 * called at any time, and the choice must never remove the last one.
 */
export function roleAfterOnboarding(
  current: User["role"],
  chosen: "hiker" | "club_admin",
): User["role"] {
  return current === "super_admin" ? current : chosen;
}
