import type { ReactElement } from "react";
import { Resend } from "resend";

import { env } from "@/config/env";

/**
 * Resend client, instantiated lazily so the app still boots in environments
 * where transactional email isn't configured yet (RESEND_API_KEY is optional
 * in `env`). `sendEmail` throws a clear error if it's called without a key.
 */
let resend: Resend | null = null;

function getResend(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not set — cannot send email. Add it to .env.local.",
    );
  }
  resend ??= new Resend(env.RESEND_API_KEY);
  return resend;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: ReactElement;
}

/**
 * Send a transactional email rendered from a React Email template via Resend.
 * Throws if Resend isn't configured or the send fails, so callers (e.g. Better
 * Auth's email hooks) surface the failure rather than silently dropping mail.
 */
export async function sendEmail({
  to,
  subject,
  template,
}: SendEmailOptions): Promise<void> {
  const from = env.EMAIL_FROM;
  if (!from) {
    throw new Error(
      "EMAIL_FROM is not set — cannot send email. Add it to .env.local.",
    );
  }

  const { error } = await getResend().emails.send({
    from,
    to,
    subject,
    react: template,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
