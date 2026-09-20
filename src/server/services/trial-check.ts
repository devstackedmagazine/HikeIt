import { and, between, eq, isNull } from "drizzle-orm";

import { env } from "@/config/env";
import { db } from "@/lib/db";
import { notifications, organizations, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { TrialEnding } from "@/lib/email/templates/trial-ending";
import {
  resolveEntitlement,
  TRIAL_ENDING_NOTICE_DAYS,
} from "@/lib/entitlements";
import { captureError } from "@/lib/sentry";
import { formatTripDate } from "@/lib/utils/datetime";

/**
 * Daily "your trial ends in 7 days" notice.
 *
 * The trial grants full Pro access, so what lapses is the club's feature set —
 * unlimited trips and members — not a commission rate.
 *
 * The date filter is a ±1 day *window* around the 7-day mark rather than an
 * exact-day match, so a cron run that's skipped or delayed doesn't silently
 * drop a club. `trialEndingNotifiedAt` is what actually guarantees one send per
 * club — the window may match the same club on consecutive days, and the
 * timestamp is what stops the second one.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface TrialCheckResult {
  candidates: number;
  emailsSent: number;
  notified: number;
  skippedSubscribed: number;
  errors: string[];
}

export async function runTrialCheck(
  now: Date = new Date(),
): Promise<TrialCheckResult> {
  const result: TrialCheckResult = {
    candidates: 0,
    emailsSent: 0,
    notified: 0,
    skippedSubscribed: 0,
    errors: [],
  };

  const from = new Date(now.getTime() + (TRIAL_ENDING_NOTICE_DAYS - 1) * DAY_MS);
  const to = new Date(now.getTime() + (TRIAL_ENDING_NOTICE_DAYS + 1) * DAY_MS);

  const candidates = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      name: organizations.name,
      ownerId: organizations.ownerId,
      subscriptionTier: organizations.subscriptionTier,
      trialEndsAt: organizations.trialEndsAt,
    })
    .from(organizations)
    .where(
      and(
        between(organizations.trialEndsAt, from, to),
        isNull(organizations.trialEndingNotifiedAt),
        isNull(organizations.deletedAt),
      ),
    );

  result.candidates = candidates.length;

  for (const club of candidates) {
    // A club that already subscribed isn't affected by its trial lapsing —
    // its access comes from the subscription — so warning it about losing
    // features would be wrong. `resolveEntitlement` is the authority on that,
    // rather than re-deriving the precedence rules here.
    if (resolveEntitlement(club, now).source !== "trial") {
      result.skippedSubscribed++;
      continue;
    }

    if (!club.trialEndsAt || !club.ownerId) continue;

    const endDateLabel = formatTripDate(club.trialEndsAt);
    const billingUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;

    try {
      const owner = await db.query.users.findFirst({
        where: eq(users.id, club.ownerId),
        columns: { email: true },
      });

      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: "Prova juaj falas mbaron pas 7 ditësh",
          template: TrialEnding({
            clubName: club.name,
            endDateLabel,
            billingUrl,
          }),
        });
        result.emailsSent++;
      }

      await db.insert(notifications).values({
        userId: club.ownerId,
        type: "trial_ending",
        title: "Prova falas mbaron pas 7 ditësh",
        body: `Prej ${endDateLabel}, ${club.name} kalon në planin falas: deri në 3 udhëtime në muaj dhe 50 anëtarë.`,
        link: "/dashboard/billing",
      });

      // Written only after the notice actually went out, so a failure above
      // leaves the club eligible for tomorrow's run instead of silently
      // burning its one notification.
      await db
        .update(organizations)
        .set({ trialEndingNotifiedAt: now })
        .where(eq(organizations.id, club.id));

      result.notified++;
    } catch (error) {
      captureError(error, {
        action: "runTrialCheck",
        extra: { organizationId: club.id, slug: club.slug },
      });
      result.errors.push(club.slug);
    }
  }

  return result;
}
