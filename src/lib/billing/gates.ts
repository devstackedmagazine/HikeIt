import type { Organization } from "@/lib/db/schema";
import { resolveEntitlement } from "@/lib/entitlements";

export const FREE_TIER_LIMITS = {
  tripsPerMonth: 3,
  members: 50,
} as const;

/** The fields every gate needs. A structural subset of `Organization`. */
type GateOrg = Pick<Organization, "subscriptionTier" | "trialEndsAt">;

/**
 * Whether a club currently has paid-tier access.
 *
 * Always resolved through `resolveEntitlement`, never read off
 * `subscriptionTier` directly — a club inside its free trial is entitled to
 * Pro without a subscription row, and reading the column alone would cap it.
 */
function isPaid(org: GateOrg): boolean {
  return resolveEntitlement(org).tier !== "free";
}

/** Free tier may create trips, but the caller must enforce the monthly count. */
export function canCreateTrip(org: GateOrg): boolean {
  return isPaid(org) || true;
}

/** Only paid tiers get unlimited members. */
export function canHaveUnlimitedMembers(org: GateOrg): boolean {
  return isPaid(org);
}
