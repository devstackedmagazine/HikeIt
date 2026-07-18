"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { env } from "@/config/env";
import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema";
import { captureError } from "@/lib/sentry";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import {
  mapAccountStatus,
  type StripeAccountStatus,
} from "@/lib/stripe/connect-status";

interface UrlResult {
  url?: string;
  error?: string;
}

interface StatusResult {
  status?: StripeAccountStatus;
  error?: string;
}

/** Active admin of `organizationId`, or null. Connect payout config is
 * admin-only — organizers can manage trips but not the club's bank details. */
async function requireOrgAdmin(userId: string, organizationId: string) {
  const rows = await db
    .select({ org: organizations })
    .from(organizations)
    .innerJoin(
      organizationMembers,
      and(
        eq(organizationMembers.organizationId, organizations.id),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.role, "admin"),
        isNull(organizationMembers.leftAt),
      ),
    )
    .where(eq(organizations.id, organizationId))
    .limit(1);
  return rows[0]?.org ?? null;
}

/**
 * Create a Stripe Connect Express account for the club if it doesn't have one,
 * saving the id back to the org. Returns the account id. Admin-only.
 */
export async function createConnectAccount(
  organizationId: string,
): Promise<{ accountId?: string; error?: string }> {
  if (!isStripeConfigured()) {
    return { error: "Pagesat nuk janë konfiguruar ende." };
  }
  const session = await getOptionalSession();
  if (!session) return { error: "Duhet të jeni i kyçur." };

  const org = await requireOrgAdmin(session.user.id, organizationId);
  if (!org) return { error: "Nuk keni qasje." };

  if (org.stripeConnectAccountId) {
    return { accountId: org.stripeConnectAccountId };
  }

  try {
    const account = await getStripe().accounts.create({
      type: "express",
      metadata: { organizationId: org.id },
    });
    await db
      .update(organizations)
      .set({
        stripeConnectAccountId: account.id,
        stripeAccountStatus: "pending",
      })
      .where(eq(organizations.id, org.id));
    return { accountId: account.id };
  } catch (error) {
    captureError(error, {
      action: "createConnectAccount",
      userId: session.user.id,
      extra: { organizationId },
    });
    return { error: "Nuk mundëm të krijojmë llogarinë Stripe. Provoni sërish." };
  }
}

/**
 * Create a hosted Stripe onboarding link for the club's Connect account,
 * creating the account first if needed. Returns the URL to redirect to.
 */
export async function createOnboardingLink(
  organizationId: string,
): Promise<UrlResult> {
  if (!isStripeConfigured()) {
    return { error: "Pagesat nuk janë konfiguruar ende." };
  }
  const session = await getOptionalSession();
  if (!session) return { error: "Duhet të jeni i kyçur." };

  const org = await requireOrgAdmin(session.user.id, organizationId);
  if (!org) return { error: "Nuk keni qasje." };

  let accountId = org.stripeConnectAccountId ?? undefined;
  if (!accountId) {
    const created = await createConnectAccount(organizationId);
    if (created.error) return { error: created.error };
    accountId = created.accountId;
  }
  if (!accountId) return { error: "Nuk u krijua llogaria Stripe." };

  const settingsUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/club/${org.slug}?tab=settings`;
  try {
    const link = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${settingsUrl}&stripe=refresh`,
      return_url: `${settingsUrl}&stripe=success`,
      type: "account_onboarding",
    });
    return { url: link.url };
  } catch (error) {
    captureError(error, {
      action: "createOnboardingLink",
      userId: session.user.id,
      extra: { organizationId },
    });
    return { error: "Nuk mundëm të hapim konfigurimin e Stripe. Provoni sërish." };
  }
}

/**
 * Fetch the club's Connect account from Stripe, map charges_enabled /
 * details_submitted to our status enum, persist it, and return it. Called on
 * return from onboarding (and by the `account.updated` webhook's DB path).
 */
export async function getConnectAccountStatus(
  organizationId: string,
): Promise<StatusResult> {
  if (!isStripeConfigured()) {
    return { error: "Pagesat nuk janë konfiguruar ende." };
  }
  const session = await getOptionalSession();
  if (!session) return { error: "Duhet të jeni i kyçur." };

  const org = await requireOrgAdmin(session.user.id, organizationId);
  if (!org) return { error: "Nuk keni qasje." };

  if (!org.stripeConnectAccountId) {
    return { status: "not_connected" };
  }

  try {
    const account = await getStripe().accounts.retrieve(
      org.stripeConnectAccountId,
    );
    const status = mapAccountStatus(account);

    await db
      .update(organizations)
      .set({
        stripeAccountStatus: status,
        stripeOnboardingCompletedAt:
          status === "active" && !org.stripeOnboardingCompletedAt
            ? new Date()
            : org.stripeOnboardingCompletedAt,
      })
      .where(eq(organizations.id, org.id));

    revalidatePath(`/dashboard/club/${org.slug}`);
    return { status };
  } catch (error) {
    captureError(error, {
      action: "getConnectAccountStatus",
      userId: session.user.id,
      extra: { organizationId },
    });
    return { error: "Nuk mundëm të lexojmë statusin e Stripe." };
  }
}
