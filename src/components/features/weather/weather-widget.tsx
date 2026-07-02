import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  type LucideIcon,
  Sun,
  Wind,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { getWeatherForLocation } from "@/lib/weather/client";
import { evaluateWeatherAlert } from "@/lib/weather/thresholds";

const CONDITION_ICON: Record<string, LucideIcon> = {
  thunderstorm: CloudLightning,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  mist: Wind,
  clear: Sun,
  clouds: Cloud,
};

const BANNER: Record<
  "warning" | "alert" | "danger",
  { className: string; text: string }
> = {
  warning: {
    className:
      "bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
    text: "⚠️ Kushte të pafavorshme",
  },
  alert: {
    className:
      "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
    text: "🟠 Kushte të rrezikshme",
  },
  danger: {
    className: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
    text: "🔴 RREZIK — Udhëtimi nuk rekomandohet",
  },
};

function dayLabel(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", { weekday: "short" }).format(date);
}

export async function WeatherWidget({
  lat,
  lng,
}: {
  lat: number | string | null;
  lng: number | string | null;
}) {
  if (lat === null || lng === null) return null;

  let data;
  try {
    data = await getWeatherForLocation(lat, lng);
  } catch {
    return (
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          Moti nuk disponohet
        </CardContent>
      </Card>
    );
  }

  const { current, daily } = data;
  const alert = evaluateWeatherAlert(current);
  const CurrentIcon = CONDITION_ICON[current.condition] ?? Cloud;

  return (
    <Card className="overflow-hidden">
      {alert.level !== "clear" ? (
        <div
          className={cn(
            "px-4 py-2 text-sm font-medium",
            BANNER[alert.level].className,
          )}
        >
          {BANNER[alert.level].text}
        </div>
      ) : null}
      <CardContent className="space-y-4 py-4">
        <div className="flex items-center gap-4">
          <CurrentIcon className="size-10 text-primary" />
          <div>
            <p className="text-3xl font-bold leading-none">
              {current.temperature}°C
            </p>
            <p className="text-sm capitalize text-muted-foreground">
              {current.conditionDescription}
            </p>
          </div>
          <div className="ml-auto space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center justify-end gap-1.5">
              <Wind className="size-4" />
              {current.windSpeed} km/h
            </p>
            <p className="flex items-center justify-end gap-1.5">
              <Droplets className="size-4" />
              {current.rainProbability}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t pt-3">
          {daily.slice(0, 3).map((day) => {
            const Icon = CONDITION_ICON[day.condition] ?? Cloud;
            return (
              <div
                key={day.date.toISOString()}
                className="flex flex-col items-center gap-1 text-center"
              >
                <span className="text-xs text-muted-foreground">
                  {dayLabel(day.date)}
                </span>
                <Icon className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {day.tempMax}° / {day.tempMin}°
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-right text-[10px] text-muted-foreground">
          Të dhënat nga{" "}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Open-Meteo.com
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
