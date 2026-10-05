import { and, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { trips } from "@/lib/db/schema";
import { tripOverCutovers } from "@/lib/trips/display-status";

/**
 * Auto-completion of trips that are clearly over.
 *
 * Cutover is `end_datetime + 90 minutes` when an end time was given, and
 * `start_datetime + 12 hours` when it wasn't. Both are written as a comparison
 * against a *shifted parameter* rather than a shifted column
 * (`end_datetime <= $now - interval '90 minutes'`, not
 * `end_datetime + interval '90 minutes' <= $now`) — algebraically identical,
 * but only the first form leaves a bare column on the left where a btree index
 * can serve it. Same reason the two cases are OR'd branches instead of one
 * `coalesce(...)`: a coalesce over both columns is opaque to every index on
 * either one, so it would force a seq scan on `trips` every hour.
 *
 * See `sql/2026-09-04-trip-autocomplete-indexes.sql` for the two partial
 * indexes these branches are written against.
 *
 * Only `open` and `full` are eligible. `in_progress` is deliberately excluded:
 * that status means somebody is tracking the trip by hand, and auto-completion
 * has no business overriding them. `draft`, `canceled` and `completed` are
 * terminal or not-yet-live and are never touched.
 */

// Cutover constants live in `@/lib/trips/display-status`, shared with the
// status shown in the UI.

export interface CompleteTripsResult {
  completed: number;
  tripIds: string[];
}

/** `db` itself or a transaction handle, so the caller can commit the update
 * together with its audit row. */
type Executor = Pick<typeof db, "update">;

export async function runCompleteTrips(
  now: Date = new Date(),
  executor: Executor = db,
): Promise<CompleteTripsResult> {
  const { endCutover, startCutover } = tripOverCutovers(now);

  const completed = await executor
    .update(trips)
    .set({ status: "completed" })
    .where(
      and(
        // Literal statuses rather than `inArray`, which would bind them as
        // parameters. The partial indexes are predicated on
        // `status in ('open','full')`, and Postgres can only prove that
        // `status in ($1,$2)` satisfies that predicate while it's building a
        // custom plan — once it switches to a generic plan the proof fails and
        // both indexes silently drop out in favour of a seq scan.
        sql`${trips.status} in ('open', 'full')`,
        isNull(trips.deletedAt),
        sql`(
          (${trips.endDatetime} is not null and ${trips.endDatetime} <= ${endCutover})
          or
          (${trips.endDatetime} is null and ${trips.startDatetime} <= ${startCutover})
        )`,
      ),
    )
    .returning({ id: trips.id });

  return {
    completed: completed.length,
    tripIds: completed.map((trip) => trip.id),
  };
}
