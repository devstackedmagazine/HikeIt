import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default withSentryConfig(nextConfig, {
  org: "hikeit-kosovo",
  project: "javascript-nextjs",

  // Falls back to the SENTRY_AUTH_TOKEN env var if omitted; set explicitly so
  // a missing token fails loudly in CI instead of silently skipping upload.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Source maps are uploaded to Sentry (for readable stack traces) and then
  // deleted from the build output — never shipped to the browser.
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Include node_modules/Next.js-internal frames in the upload so vendor
  // stack frames resolve too, not just first-party code.
  widenClientFileUpload: true,

  // Quiet CLI output locally; keep it verbose in CI so upload failures are visible.
  silent: !process.env.CI,

  // Don't send Sentry's own build-plugin telemetry.
  telemetry: false,
});
