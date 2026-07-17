import * as Sentry from "@sentry/nextjs";

// See sentry.server.config.ts for why this is gated at the top level rather
// than via `enabled: false`.
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.05,
  });
}
