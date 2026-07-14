import * as Sentry from "@sentry/nextjs";

/** Capture a handled error with context — use in server action catch blocks. */
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
    if (context?.extra) scope.setExtras(context.extra);
    Sentry.captureException(error);
  });
}

/** Log a message (not an error) for important events worth surfacing in Sentry. */
export function captureMessage(
  message: string,
  level: "info" | "warning" = "info",
  extra?: Record<string, unknown>,
) {
  Sentry.withScope((scope) => {
    if (extra) scope.setExtras(extra);
    Sentry.captureMessage(message, level);
  });
}

/** Record a business event (trip registration, club creation, …) as a breadcrumb
 * on whatever error follows it — not sent to Sentry on its own. */
export function trackEvent(name: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category: "business",
    message: name,
    data,
    level: "info",
  });
}
