import { and, eq, or, type SQL,sql } from "drizzle-orm";

import type { Trip } from "@/lib/db/schema";
import { trips } from "@/lib/db/schema";
import { tripOverCutovers } from "@/lib/trips/display-status";

/**
 * SQL mirror of `displayTripStatus`. Written like the cron query — bare
 * columns compared against shifted parameters, two OR'd branches rather than
 * a coalesce — so the trip-autocomplete indexes stay usable.
 */
export function tripOverSql(now: Date = new Date()): SQL {
  const { endCutover, startCutover } = tripOverCutovers(now);
  return sql`(
    (${trips.endDatetime} is not null and ${trips.endDatetime} <= ${endCutover})
    or
    (${trips.endDatetime} is null and ${trips.startDatetime} <= ${startCutover})
  )`;
}

export function tripNotOverSql(now: Date = new Date()): SQL {
  const { endCutover, startCutover } = tripOverCutovers(now);
  return sql`(
    (${trips.endDatetime} is not null and ${trips.endDatetime} > ${endCutover})
    or
    (${trips.endDatetime} is null and ${trips.startDatetime} > ${startCutover})
  )`;
}

/** WHERE clause for filtering by the *displayed* status. */
export function displayStatusFilter(
  status: Trip["status"],
  now: Date = new Date(),
): SQL | undefined {
  if (status === "open" || status === "full") {
    return and(eq(trips.status, status), tripNotOverSql(now));
  }
  if (status === "completed") {
    return or(
      eq(trips.status, "completed"),
      and(sql`${trips.status} in ('open', 'full')`, tripOverSql(now)),
    );
  }
  return eq(trips.status, status);
}
