import { captureRequestError } from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    // Production only: local logs stay readable while developing.
    if (process.env.NODE_ENV === "production") {
      const { installLogSanitiser } = await import("@/lib/sentry/scrub");
      installLogSanitiser();
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = captureRequestError;
