import { env } from "@/config/env";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { runTrialCheck } from "@/server/services/trial-check";

/**
 * Daily trial-ending check. Same `CRON_SECRET` bearer auth as the other cron
 * endpoints; wire it up in cron-job.org alongside trip-reminders (daily is
 * enough — the 7-day notice uses a ±1 day window).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runTrialCheck();

  await db.insert(auditLogs).values({
    action: "cron.trial_check",
    entityType: "system",
    metadata: { ...result } as Record<string, unknown>,
  });

  return Response.json(result);
}
