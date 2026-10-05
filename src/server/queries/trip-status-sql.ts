import {
  and,
  eq,
  gt,
  isNotNull,
  isNull,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

import type { Trip } from "@/lib/db/schema";
import { trips } from "@/lib/db/schema";
import { tripOverCutovers } from "@/lib/trips/display-status";

/**
 * SQL mirror of `displayTripStatus`. Written like the cron query — bare
 * columns compared against shifted parameters, two OR'd branches rather than
 * a coalesce — so the trip-autocomplete indexes stay usable.
 *
 * Column operators (`lte`, `gt`) rather than raw `sql` interpolation: they bind
 * the Date through the column's encoder, whereas a Date dropped into a raw
 * fragment reaches postgres-js unencoded and throws.
 */
export function tripOverSql(now: Date = new Date()): SQL | undefined {
  const { endCutover, startCutover } = tripOverCutovers(now);
  return or(
    and(isNotNull(trips.endDatetime), lte(trips.endDatetime, endCutover)),
    and(isNull(trips.endDatetime), lte(trips.startDatetime, startCutover)),
  );
}

export function tripNotOverSql(now: Date = new Date()): SQL | undefined {
  const { endCutover, startCutover } = tripOverCutovers(now);
  return or(
    and(isNotNull(trips.endDatetime), gt(trips.endDatetime, endCutover)),
    and(isNull(trips.endDatetime), gt(trips.startDatetime, startCutover)),
  );
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
