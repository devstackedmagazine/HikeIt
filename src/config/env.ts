import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated, typed environment variables. Import `env` from here everywhere —
 * never read `process.env` directly. Validation runs at build/startup, so a
 * missing or malformed value fails fast instead of surfacing as a runtime crash.
 *
 * Only the variables we actually use *today* are required. Integrations that
 * land in later sessions (Stripe, R2, OpenWeather, Resend, Sentry, PostHog) are
 * `.optional()` for now so `pnpm dev` runs before every key is provisioned.
 * Promote them to required as each feature ships — format is still validated
 * whenever a value is present.
 */
export const env = createEnv({
  server: {
    // Database — required.
    DATABASE_URL: z.url(),
    DIRECT_URL: z.url(),

    // Auth — required.
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),

    // Stripe — optional until billing ships.
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

    // Cloudflare R2 — optional until uploads ship.
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_PUBLIC_URL: z.url().optional(),

    // OpenWeatherMap — optional until weather ships.
    OPENWEATHER_API_KEY: z.string().min(1).optional(),

    // Cron secret protecting scheduled endpoints — optional in dev.
    CRON_SECRET: z.string().min(1).optional(),

    // Resend — optional until transactional email ships.
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),

    // Sentry — optional.
    SENTRY_ORG: z.string().min(1).optional(),
    SENTRY_PROJECT: z.string().min(1).optional(),
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  },

  client: {
    // App URL — required.
    NEXT_PUBLIC_APP_URL: z.url(),

    // Stripe (publishable) — optional until billing ships.
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),

    // Maps use Leaflet + OpenStreetMap — no token required.

    // Sentry / PostHog — optional.
    NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),
  },

  /**
   * Next.js inlines `NEXT_PUBLIC_*` at build time, so client vars must be
   * referenced explicitly here rather than via a dynamic `process.env` lookup.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },

  /** Treat empty strings (`FOO=`) as "not set" so optionals behave intuitively. */
  emptyStringAsUndefined: true,
});
