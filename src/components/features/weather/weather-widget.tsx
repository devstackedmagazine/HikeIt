import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  type LucideIcon,
  Sun,
  Wind,
} from "lucide-react";

import { getWeatherForLocation } from "@/lib/weather/client";

const CONDITION_ICON: Record<string, LucideIcon> = {
  thunderstorm: CloudLightning,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  mist: Wind,
  clear: Sun,
  clouds: Cloud,
};

/** Full weekday in Albanian, uppercased (e.g. "E HËNË"). */
function dayLabel(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", { weekday: "long" })
    .format(date)
    .toUpperCase();
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
      <div className="border border-summit/10 bg-summit/[0.03] p-4 text-xs text-summit/40">
        Moti nuk disponohet
      </div>
    );
  }

  const { current, daily } = data;
  const CurrentIcon = CONDITION_ICON[current.condition] ?? Cloud;

  return (
    <div className="border border-summit/10 bg-summit/[0.03] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-[9px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
            Moti Sot
          </p>
          <p className="font-heading text-[32px] leading-none font-extrabold tracking-[-0.02em] text-summit">
            {current.temperature}°C
          </p>
        </div>
        <CurrentIcon className="size-7 text-summit/50" />
      </div>

      <div className="mt-3">
        {daily.slice(0, 3).map((day) => (
          <div
            key={day.date.toISOString()}
            className="flex items-center justify-between border-b border-summit/[0.06] py-1.5"
          >
            <span className="text-[11px] font-medium text-summit/50 uppercase">
              {dayLabel(day.date)}
            </span>
            <span className="text-[11px] font-semibold text-summit/60">
              {day.tempMax}° / {day.tempMin}°
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[9px] text-summit/20">
        Burimi:{" "}
        <a
          href="https://open-meteo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-summit/40"
        >
          Open-Meteo.com
        </a>
      </p>
    </div>
  );
}
