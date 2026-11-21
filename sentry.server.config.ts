import * as Sentry from "@sentry/nextjs";

import { scrubEvent } from "@/lib/sentry/scrub";

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

      // Safety net for anything that didn't come through `captureError`:
      // bound query values, emails, phone numbers, personal fields, request
      // bodies and cookies are removed before the event leaves the server.
      scrubEvent(event);

      return event;
    },

    ignoreErrors: [
      // Next.js's own control-flow signals — thrown internally by notFound()
      // and redirect() and caught by Next's router, not real errors. This
      // codebase calls redirect() constantly (auth gates, onboarding, etc.),
      // so without this filter nearly every redirect would show up as a false
      // Sentry issue.
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
      // Browser-originated noise. These can't be thrown by server code, but
      // the patterns are kept in sync across all three runtimes so a stray
      // client error routed through the server SDK is still filtered.
      "window.webkit.messageHandlers",
      "updateFrom",
    ],
  });
}
