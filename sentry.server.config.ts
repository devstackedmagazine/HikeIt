import * as Sentry from "@sentry/nextjs";

// Skip Sentry.init() entirely outside production. `enabled: false` still
// spins up tracing/transport machinery, which is unnecessary overhead in
// local dev (and can be slow if outbound network to Sentry is restricted),
// where nothing gets sent anyway.
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    environment: process.env.NODE_ENV,

    // Lower sample rate on the server — every request/query would otherwise
    // burn through the free quota fast.
    tracesSampleRate: 0.05,

    beforeSend(event, hint) {
      const error = hint.originalException;

      // Never log auth errors as Sentry issues — these are user mistakes,
      // not application bugs (e.g. a bad password, an expired session).
      if (error instanceof Error) {
        if (
          error.message.includes("Unauthorized") ||
          error.message.includes("Forbidden") ||
          error.message.includes("Not found")
        ) {
          return null;
        }
      }

      // Scrub cookies before the event ever leaves the server.
      if (event.request?.cookies) {
        delete event.request.cookies;
      }

      return event;
    },

    // Next.js's own control-flow signals — thrown internally by notFound()
    // and redirect() and caught by Next's router, not real errors. This
    // codebase calls redirect() constantly (auth gates, onboarding, etc.),
    // so without this filter nearly every redirect would show up as a false
    // Sentry issue.
    ignoreErrors: ["NEXT_NOT_FOUND", "NEXT_REDIRECT"],
  });
}
