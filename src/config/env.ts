import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated, typed environment variables. Import `env` from here everywhere —
 * never read `process.env` directly. Validation runs at build/startup, so a
 * missing or malformed value fails fast instead of surfacing as a runtime crash.
 *
 * Only the variables we actually use *today* are required. Integrations that
 * land in later sessions (Paddle, R2, OpenWeather, Resend, Sentry, PostHog) are
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

    // Google OAuth — required for social sign-in.
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    // Facebook OAuth — optional until the Meta app is created.
    FACEBOOK_CLIENT_ID: z.string().min(1).optional(),
    FACEBOOK_CLIENT_SECRET: z.string().min(1).optional(),

    // Paddle — optional until billing is configured, so the app boots and
    // every page renders with none of these set.
    //
    // The environment is read from PADDLE_ENV explicitly and never inferred
    // from the API key prefix: a key pasted into the wrong environment should
    // fail loudly against the wrong API, not silently transact somewhere
    // unintended.
    PADDLE_ENV: z.enum(["sandbox", "production"]).optional(),
    PADDLE_API_KEY: z.string().min(1).optional(),
    PADDLE_WEBHOOK_SECRET: z.string().min(1).optional(),
    PADDLE_PRICE_PRO_MONTHLY: z.string().min(1).optional(),
    PADDLE_PRICE_PRO_YEARLY: z.string().min(1).optional(),
    PADDLE_PRICE_TEAM_MONTHLY: z.string().min(1).optional(),
    PADDLE_PRICE_TEAM_YEARLY: z.string().min(1).optional(),

    // Cloudflare R2 — optional until uploads ship.
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_PUBLIC_URL: z.url().optional(),

    // Weather uses Open-Meteo — no API key required.

    // Cloudinary (secret) — optional until image uploads are configured.
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),

    // Cron secret protecting scheduled endpoints — optional in dev.
    CRON_SECRET: z.string().min(1).optional(),

    // Resend — optional until transactional email ships.
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),

    // Sentry — optional.
    SENTRY_DSN: z.url().optional(),
    SENTRY_ORG: z.string().min(1).optional(),
    SENTRY_PROJECT: z.string().min(1).optional(),
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  },

  client: {
    // App URL — required.
    NEXT_PUBLIC_APP_URL: z.url(),

    // Paddle (client-side) — optional until billing is configured.
    //
    // NEXT_PUBLIC_PADDLE_ENV is separate from the server-side PADDLE_ENV on
    // purpose: Paddle.js selects its environment in the browser via
    // `Paddle.Environment.set()`, and a server-only variable cannot reach it.
    // Without this a sandbox client token would try to talk to live Paddle.
    NEXT_PUBLIC_PADDLE_ENV: z.enum(["sandbox", "production"]).optional(),
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().min(1).optional(),

    // Cloudinary (public) — optional until image uploads are configured.
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1).optional(),

    // Maps use Leaflet + Thunderforest Outdoors tiles.
    NEXT_PUBLIC_THUNDERFOREST_API_KEY: z.string().min(1).optional(),

    // Sentry / PostHog — optional.
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
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
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    PADDLE_ENV: process.env.PADDLE_ENV,
    PADDLE_API_KEY: process.env.PADDLE_API_KEY,
    PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,
    PADDLE_PRICE_PRO_MONTHLY: process.env.PADDLE_PRICE_PRO_MONTHLY,
    PADDLE_PRICE_PRO_YEARLY: process.env.PADDLE_PRICE_PRO_YEARLY,
    PADDLE_PRICE_TEAM_MONTHLY: process.env.PADDLE_PRICE_TEAM_MONTHLY,
    PADDLE_PRICE_TEAM_YEARLY: process.env.PADDLE_PRICE_TEAM_YEARLY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PADDLE_ENV: process.env.NEXT_PUBLIC_PADDLE_ENV,
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN:
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    NEXT_PUBLIC_THUNDERFOREST_API_KEY:
      process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },

  /** Treat empty strings (`FOO=`) as "not set" so optionals behave intuitively. */
  emptyStringAsUndefined: true,
});
