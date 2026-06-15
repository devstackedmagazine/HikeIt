import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/config/env";
import * as schema from "@/lib/db/schema";

/**
 * Postgres client + Drizzle instance.
 *
 * - Uses the pooled `DATABASE_URL` (Supabase PgBouncer). `prepare: false` is
 *   required because PgBouncer in transaction mode doesn't support prepared
 *   statements.
 * - The client is cached on `globalThis` in non-production so Next.js HMR
 *   doesn't open a new connection pool on every reload.
 */
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForDb.client ?? postgres(env.DATABASE_URL, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });
