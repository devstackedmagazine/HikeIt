import * as Sentry from "@sentry/nextjs";

import { sanitizeForLog, sanitizeText } from "@/lib/sentry/scrub";

/**
 * Capture a handled error with context — use in server action catch blocks.
 * The error and its context are sanitised here, so no call site has to
 * remember to: see `@/lib/sentry/scrub`.
 */
export function captureError(
  error: unknown,
  context?: {
    action?: string;
    userId?: string;
    extra?: Record<string, unknown>;
  },
) {
  Sentry.withScope((scope) => {
    if (context?.action) scope.setTag("action", context.action);
    if (context?.userId) scope.setUser({ id: context.userId });
    if (context?.extra) scope.setExtras(cleanExtras(context.extra));
    Sentry.captureException(sanitizeForLog(error));
  });
}

/** Log a message (not an error) for important events worth surfacing in Sentry. */
export function captureMessage(
  message: string,
  level: "info" | "warning" = "info",
  extra?: Record<string, unknown>,
) {
  Sentry.withScope((scope) => {
    if (extra) scope.setExtras(cleanExtras(extra));
    Sentry.captureMessage(sanitizeText(message), level);
  });
}

/** Record a business event (trip registration, club creation, …) as a breadcrumb
 * on whatever error follows it — not sent to Sentry on its own. */
export function trackEvent(name: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category: "business",
    message: name,
    data: data && cleanExtras(data),
    level: "info",
  });
}

function cleanExtras(extra: Record<string, unknown>): Record<string, unknown> {
  return sanitizeForLog(extra) as Record<string, unknown>;
}
