import * as Sentry from "@sentry/nextjs";

// See sentry.server.config.ts for why this is gated at the top level rather
// than via `enabled: false`.
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.05,

    // Kept in sync with the server and client configs. The proxy runs here and
    // calls redirect(), so the Next.js control-flow signals matter most.
    ignoreErrors: [
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
      "window.webkit.messageHandlers",
      "updateFrom",
    ],
  });
}
