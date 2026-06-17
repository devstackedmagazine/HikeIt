import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { trails } from "../schema";
import { trailSeeds } from "./trails";

/**
 * Standalone seed runner (run via `pnpm db:seed`). Deliberately self-contained:
 * it builds its own connection from DIRECT_URL instead of importing
 * `@/lib/db`, so it avoids the Next.js env layer and path aliases when executed
 * by tsx outside the app runtime.
 */
async function main() {
  process.loadEnvFile(".env.local");

  const url = process.env.DIRECT_URL;
  if (!url) {
    throw new Error("DIRECT_URL is not set — cannot seed. Check .env.local.");
  }

  const client = postgres(url, { prepare: false });
  const db = drizzle(client);

  try {
    const inserted = await db
      .insert(trails)
      .values(trailSeeds)
      .onConflictDoNothing({ target: trails.slug })
      .returning({ slug: trails.slug });

    console.log(
      `Seeded trails: ${inserted.length} inserted, ${
        trailSeeds.length - inserted.length
      } skipped (already existed).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
