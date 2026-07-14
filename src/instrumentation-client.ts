import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Only run in production — never pollute Sentry with dev/preview noise.
  enabled: process.env.NODE_ENV === "production",

  // 10% of transactions — enough signal without burning the free quota.
  tracesSampleRate: 0.1,

  // Session Replay: 5% of normal sessions, 100% of sessions with an error.
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and inputs by default — this app carries auth/billing
      // flows, so err on the side of privacy.
      maskAllText: true,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
  ],

  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore network errors — the user's connection, not our bug.
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return null;
    }

    // Ignore Next.js router cancellation (normal navigation behavior).
    if (
      error instanceof Error &&
      error.message.includes("Interrupted navigation")
    ) {
      return null;
    }

    // Ignore browser extension errors.
    if (
      event.exception?.values?.[0]?.stacktrace?.frames?.some((frame) =>
        frame.filename?.includes("extension://"),
      )
    ) {
      return null;
    }

    return event;
  },

  ignoreErrors: [
    // Browser noise.
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Network errors.
    "NetworkError",
    "Network request failed",
    "Load failed",
    // User-initiated cancellations.
    "AbortError",
    "The user aborted a request",
  ],
});

// Required by the SDK to instrument App Router navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
