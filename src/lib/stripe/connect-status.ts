export type StripeAccountStatus =
  | "not_connected"
  | "pending"
  | "active"
  | "restricted";

/**
 * Map a Stripe Connect account's capability flags to our status enum.
 * Shared by the onboarding actions and the `account.updated` webhook.
 *
 * Lives outside the `"use server"` action module because that may only
 * export async functions.
 */
export function mapAccountStatus(account: {
  charges_enabled?: boolean;
  details_submitted?: boolean;
}): StripeAccountStatus {
  if (account.charges_enabled) return "active";
  if (account.details_submitted) return "restricted";
  return "pending";
}
