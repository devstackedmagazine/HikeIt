import type { Organization } from "@/lib/db/schema";

export const FREE_TIER_LIMITS = {
  tripsPerMonth: 3,
  members: 50,
} as const;

function isPaid(org: Pick<Organization, "subscriptionTier">): boolean {
  return org.subscriptionTier === "pro" || org.subscriptionTier === "team";
}

/** Free tier may create trips, but the caller must enforce the monthly count. */
export function canCreateTrip(
  org: Pick<Organization, "subscriptionTier">,
): boolean {
  return isPaid(org) || true;
}

/** Only paid tiers may collect payments for trips. */
export function canCollectPayments(
  org: Pick<Organization, "subscriptionTier">,
): boolean {
  return isPaid(org);
}

/** Only paid tiers get unlimited members. */
export function canHaveUnlimitedMembers(
  org: Pick<Organization, "subscriptionTier">,
): boolean {
  return isPaid(org);
}
