import { env } from "@/config/env";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { runWeatherCheck } from "@/server/services/weather-check";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeatherCheck();

  await db.insert(auditLogs).values({
    action: "cron.weather_check",
    entityType: "system",
    metadata: { ...result } as Record<string, unknown>,
  });

  return Response.json(result);
}
