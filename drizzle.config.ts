import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit runs outside Next.js, so it doesn't auto-load `.env.local`.
 * Node 22's built-in `loadEnvFile` reads it without an extra dependency.
 * If the file is absent (e.g. CI), fall back to the real environment.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local — rely on variables already present in the environment.
}

const url = process.env.DIRECT_URL;
if (!url) {
  throw new Error(
    "DIRECT_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  // Migrations use the DIRECT connection (port 5432), not the pooler.
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
