import * as Sentry from "@sentry/nextjs";

import { env } from "@/config/env";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { captureError, captureMessage } from "@/lib/sentry";
import { runCompleteTrips } from "@/server/services/complete-trips";

/**
 * Hourly auto-completion of trips that are over. Same `CRON_SECRET` bearer
 * auth as the other cron endpoints; wire it up in cron-job.org.
 *
 * Exactly one Sentry message per *run*, never per trip — the point is a
 * visible trail that the job is alive, not the per-row event stream we already
 * cleaned out of this project once.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Trip ids attached to the Sentry message. The count is the signal; the ids
 * are just enough to spot-check a run without turning one extra into a wall. */
const SENTRY_TRIP_ID_SAMPLE = 20;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // One transaction so a failed audit insert rolls back the completions
    // instead of leaving them committed behind a 500.
    const result = await db.transaction(async (tx) => {
      const result = await runCompleteTrips(new Date(), tx);
      await tx.insert(auditLogs).values({
        action: "cron.complete_trips",
        entityType: "system",
        metadata: { ...result } as Record<string, unknown>,
      });
      return result;
    });

    captureMessage("cron.complete_trips", "info", {
      completed: result.completed,
      tripIds: result.tripIds.slice(0, SENTRY_TRIP_ID_SAMPLE),
      tripIdsTruncated: result.tripIds.length > SENTRY_TRIP_ID_SAMPLE,
    });

    return Response.json(result);
  } catch (error) {
    // Non-200 on purpose: cron-job.org's own failure alerting is the monitor
    // for this job, so swallowing the error would leave it silently dead.
    // Postgres SQLSTATE (e.g. 42703 undefined_column, 42P01 undefined_table) —
    // safe to expose, and enough to tell which kind of schema drift it is.
    const pgCode =
      (error as { code?: string })?.code ??
      (error as { cause?: { code?: string } })?.cause?.code;

    console.error("[cron.complete_trips] failed", error);
    captureError(error, {
      action: "cron.complete_trips",
      extra: { pgCode },
    });
    // Serverless can freeze before the queued event is sent.
    await Sentry.flush(2000);

    return Response.json({ code: pgCode ?? "unknown" }, { status: 500 });
  }
}
