import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { organizations, trails, trips } from "../schema";
import { clubSeeds, tripSeeds } from "./clubs";
import { trailSeeds } from "./trails";

/**
 * Standalone seed runner (run via `pnpm db:seed`). Deliberately self-contained:
 * it builds its own connection from DIRECT_URL instead of importing
 * `@/lib/db`, so it avoids the Next.js env layer and path aliases when executed
 * by tsx outside the app runtime. Every insert is idempotent.
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
    const insertedTrails = await db
      .insert(trails)
      .values(trailSeeds)
      .onConflictDoNothing({ target: trails.slug })
      .returning({ slug: trails.slug });
    console.log(`Trails: ${insertedTrails.length} inserted.`);

    const insertedClubs = await db
      .insert(organizations)
      .values(clubSeeds)
      .onConflictDoNothing({ target: organizations.slug })
      .returning({ slug: organizations.slug });
    console.log(`Clubs: ${insertedClubs.length} inserted.`);

    // Resolve club + trail ids by slug so trips can reference them.
    const allClubs = await db
      .select({ id: organizations.id, slug: organizations.slug })
      .from(organizations);
    const allTrails = await db
      .select({
        id: trails.id,
        slug: trails.slug,
        startLat: trails.startLat,
        startLng: trails.startLng,
      })
      .from(trails);
    const clubBySlug = new Map(allClubs.map((c) => [c.slug, c.id]));
    const trailBySlug = new Map(allTrails.map((t) => [t.slug, t]));

    const tripValues = tripSeeds
      .map((t) => {
        const organizationId = clubBySlug.get(t.clubSlug);
        const trail = trailBySlug.get(t.trailSlug);
        if (!organizationId) return null;
        const start = new Date();
        start.setDate(start.getDate() + t.daysFromNow);
        start.setHours(7, 0, 0, 0);
        return {
          slug: t.slug,
          organizationId,
          trailId: trail?.id ?? null,
          title: t.title,
          description: t.description,
          startDatetime: start,
          meetingPoint: t.meetingPoint,
          // Meeting point coordinates default to the linked trail's start.
          meetingLat: trail?.startLat ?? null,
          meetingLng: trail?.startLng ?? null,
          maxParticipants: t.maxParticipants,
          priceEur: t.priceEur,
          difficulty: t.difficulty,
          status: "open" as const,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    // Upsert so re-running backfills meeting coordinates on existing trips.
    const insertedTrips = await db
      .insert(trips)
      .values(tripValues)
      .onConflictDoUpdate({
        target: trips.slug,
        set: {
          meetingLat: sql`excluded.meeting_lat`,
          meetingLng: sql`excluded.meeting_lng`,
          startDatetime: sql`excluded.start_datetime`,
          difficulty: sql`excluded.difficulty`,
          priceEur: sql`excluded.price_eur`,
          maxParticipants: sql`excluded.max_participants`,
        },
      })
      .returning({ slug: trips.slug });
    console.log(`Trips: ${insertedTrips.length} upserted.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
