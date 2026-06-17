import { and, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";

import { env } from "@/config/env";
import { db } from "@/lib/db";
import {
  notifications,
  organizations,
  tripRegistrations,
  trips,
  users,
  weatherAlerts,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { WeatherAlert } from "@/lib/email/templates/weather-alert";
import { formatTripDateTime } from "@/lib/utils/datetime";
import {
  getWeatherForLocation,
  type WeatherData,
} from "@/lib/weather/client";
import {
  type AlertLevel,
  evaluateWeatherAlert,
} from "@/lib/weather/thresholds";

export interface WeatherCheckResult {
  checked: number;
  alertsCreated: number;
  notificationsSent: number;
  errors: string[];
}

const LEVEL_RANK: Record<AlertLevel, number> = {
  clear: 0,
  warning: 1,
  alert: 2,
  danger: 3,
};

/** Does this severity reach the user's chosen sensitivity floor? */
function passesSensitivity(
  level: AlertLevel,
  sensitivity: "low" | "medium" | "high" | undefined,
): boolean {
  const floor =
    sensitivity === "low" ? 3 : sensitivity === "high" ? 1 : 2; // medium default
  return LEVEL_RANK[level] >= floor;
}

function sameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Check weather for every upcoming open/full trip with coordinates, persist any
 * alert-level change, and notify confirmed registrants (respecting their alert
 * sensitivity) + the club owner. Called by the cron endpoint.
 */
export async function runWeatherCheck(): Promise<WeatherCheckResult> {
  const result: WeatherCheckResult = {
    checked: 0,
    alertsCreated: 0,
    notificationsSent: 0,
    errors: [],
  };

  const now = new Date();
  const fiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  const upcoming = await db
    .select()
    .from(trips)
    .where(
      and(
        inArray(trips.status, ["open", "full"]),
        gte(trips.startDatetime, now),
        lte(trips.startDatetime, fiveDays),
        isNotNull(trips.meetingLat),
        isNotNull(trips.meetingLng),
      ),
    );

  for (const trip of upcoming) {
    result.checked++;
    try {
      const forecast = await getWeatherForLocation(
        trip.meetingLat!,
        trip.meetingLng!,
      );
      // Evaluate against the forecast for the trip's day if available, else now.
      const day = forecast.daily.find((d) =>
        sameDay(d.date, trip.startDatetime),
      );
      const target: WeatherData = day
        ? {
            temperature: day.tempMin,
            feelsLike: day.tempMin,
            humidity: 0,
            windSpeed: day.windSpeedMax,
            windGust: day.windSpeedMax,
            precipitation: day.precipitationSum,
            rainProbability:
              day.precipitationSum > 5 ? 80 : day.precipitationSum > 1 ? 50 : 0,
            condition: day.condition,
            conditionDescription: day.conditionDescription,
            forecastFor: day.date,
          }
        : forecast.current;
      const alert = evaluateWeatherAlert(target);

      const previous = trip.weatherAlertLevel as AlertLevel;
      if (alert.level === previous) {
        await sleep(500);
        continue;
      }

      // Persist the new level on the trip; record a row when it's non-clear.
      await db
        .update(trips)
        .set({ weatherAlertLevel: alert.level })
        .where(eq(trips.id, trip.id));

      if (alert.level !== "clear") {
        await db
          .insert(weatherAlerts)
          .values(buildAlertValues(trip.id, alert, target.forecastFor));
        result.alertsCreated++;

        // Notify on an increase in severity.
        if (LEVEL_RANK[alert.level] > LEVEL_RANK[previous]) {
          result.notificationsSent += await notifyTrip(trip, alert);
        }
      }
    } catch (error) {
      result.errors.push(
        `Trip ${trip.slug}: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
    await sleep(500);
  }

  return result;
}

function buildAlertValues(
  tripId: string,
  alert: ReturnType<typeof evaluateWeatherAlert>,
  forecastFor: Date,
) {
  return {
    tripId,
    level: alert.level as "warning" | "alert" | "danger",
    condition: alert.condition ?? "unknown",
    value: String(alert.value),
    threshold: String(alert.threshold),
    forecastFor,
  };
}

async function notifyTrip(
  trip: typeof trips.$inferSelect,
  alert: ReturnType<typeof evaluateWeatherAlert>,
): Promise<number> {
  const level = alert.level as "warning" | "alert" | "danger";
  const tripUrl = `${env.NEXT_PUBLIC_APP_URL}/trips/${trip.slug}`;
  const dateLabel = formatTripDateTime(trip.startDatetime);
  let sent = 0;

  // Confirmed registrants + their sensitivity preference.
  const registrants = await db
    .select({
      userId: users.id,
      email: users.email,
      preferences: users.preferences,
    })
    .from(tripRegistrations)
    .innerJoin(users, eq(users.id, tripRegistrations.userId))
    .where(
      and(
        eq(tripRegistrations.tripId, trip.id),
        eq(tripRegistrations.status, "confirmed"),
      ),
    );

  for (const r of registrants) {
    if (!passesSensitivity(level, r.preferences?.alertSensitivity)) continue;

    await db.insert(notifications).values({
      userId: r.userId,
      type: "weather",
      title: `Alarm moti: ${trip.title}`,
      body: alert.message,
      link: `/trips/${trip.slug}`,
    });

    try {
      await sendEmail({
        to: r.email,
        subject: `Alarm moti: ${trip.title}`,
        template: WeatherAlert({
          tripName: trip.title,
          date: dateLabel,
          alertLevel: level,
          message: alert.message,
          tripUrl,
        }),
      });
    } catch {
      // Email best-effort; the in-app notification already exists.
    }
    sent++;
  }

  // Notify the club owner too.
  const club = await db.query.organizations.findFirst({
    where: eq(organizations.id, trip.organizationId),
    columns: { ownerId: true },
  });
  if (club?.ownerId) {
    await db.insert(notifications).values({
      userId: club.ownerId,
      type: "weather",
      title: `Alarm moti për ${trip.title}`,
      body: alert.message,
      link: `/trips/${trip.slug}`,
    });
    sent++;
  }

  return sent;
}
