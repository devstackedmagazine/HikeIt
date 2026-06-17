import { runWeatherCheck } from "@/server/services/weather-check";

export const dynamic = "force-dynamic";

/** Dev-only helper to run the weather check without waiting for cron. */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Dev only" }, { status: 404 });
  }
  const result = await runWeatherCheck();
  return Response.json(result);
}
