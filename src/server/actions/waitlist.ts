"use server";

import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { WaitlistWelcome } from "@/lib/email/templates/waitlist-welcome";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { waitlistSchema } from "@/lib/validations/waitlist";

export interface WaitlistResult {
  success: boolean;
  error?: string;
}

/**
 * Add an email to the early-access waitlist. Idempotent: a duplicate email is
 * treated as success (we never reveal whether it already existed). The welcome
 * email is sent only for genuinely new entries, and a send failure does not
 * fail the signup.
 */
export async function joinWaitlist(
  email: string,
  source = "landing",
): Promise<WaitlistResult> {
  const parsed = waitlistSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: "Shkruani një email të vlefshëm" };
  }

  // Unauthenticated and it sends an email, so it's keyed on IP to stop a
  // single source from spraying welcome emails at arbitrary addresses.
  const limited = await enforceRateLimit("ratelimit.waitlist.join", {
    ip: await getClientIp(),
  });
  if (limited) return { success: false, error: limited };

  const normalized = parsed.data.email.trim().toLowerCase();

  try {
    const inserted = await db
      .insert(waitlist)
      .values({ email: normalized, source })
      .onConflictDoNothing({ target: waitlist.email })
      .returning({ id: waitlist.id });

    // Only a fresh insert returns a row — avoids re-emailing repeat submitters.
    if (inserted.length > 0) {
      try {
        await sendEmail({
          to: normalized,
          subject: "Mirë se vini në HikeIt!",
          template: WaitlistWelcome(),
        });
      } catch {
        // Email is best-effort; the signup itself already succeeded.
      }
    }

    return { success: true };
  } catch {
    return { success: false, error: "Diçka shkoi keq. Provoni përsëri." };
  }
}
