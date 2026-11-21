import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  type LucideIcon,
  Moon,
  Sun,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { kosovoDateKey, wallTimeOf } from "@/lib/utils/datetime";
import { getWeatherForLocation } from "@/lib/weather/client";

const CONDITION_ICON: Record<string, LucideIcon> = {
  thunderstorm: CloudLightning,
  drizzle: CloudRain,
  rain: CloudRain,
  snow: CloudSnow,
  clear: Sun,
  clouds: Cloud,
};

const TARGET_HOURS = [8, 12, 16, 20];

export async function TripWeatherWidget({
  lat,
  lng,
  tripDate,
  locationLabel,
}: {
  lat: number | string | null;
  lng: number | string | null;
  tripDate: Date;
  locationLabel: string;
}) {
  if (lat === null || lng === null) return null;

  let data;
  try {
    data = await getWeatherForLocation(lat, lng);
  } catch {
    return null;
  }

  // Pick the hourly samples on the trip's calendar day at the target hours.
  // In Kosovo time: the server's own zone (UTC on Vercel) would shift both
  // the day and the hours.
  const tripDay = kosovoDateKey(tripDate);
  const sameDay = data.hourly.filter((h) => kosovoDateKey(h.time) === tripDay);
  const slots = TARGET_HOURS.map((hour) => {
    const match = sameDay.find((h) => wallTimeOf(h.time).hour === hour);
    return match
      ? { hour, temp: match.temp, condition: match.condition }
      : null;
  }).filter(
    (s): s is { hour: number; temp: number; condition: string } => s !== null,
  );

  // Highlight the target hour closest to the trip's start time.
  const tripHour = wallTimeOf(tripDate).hour;
  const activeHour = TARGET_HOURS.reduce((best, h) =>
    Math.abs(h - tripHour) < Math.abs(best - tripHour) ? h : best,
  );

  const CurrentIcon = CONDITION_ICON[data.current.condition] ?? Cloud;

  return (
    <div className="border-summit/[0.08] bg-summit/[0.03] grid items-center gap-8 border px-6 py-5 sm:grid-cols-[auto_1fr]">
      {/* Current */}
      <div>
        <p className="text-summit/30 mb-2 text-[9px] font-semibold tracking-[0.12em] uppercase">
          Moti në {locationLabel}
        </p>
        <div className="flex items-center gap-3">
          <span className="font-heading text-summit text-[40px] leading-none font-extrabold tracking-[-0.03em]">
            {data.current.temperature}°C
          </span>
          <CurrentIcon className="text-summit/60 size-8" />
        </div>
      </div>

      {/* Hourly */}
      {slots.length > 0 ? (
        <div>
          <p className="text-summit/30 mb-3 text-[9px] font-semibold tracking-[0.12em] uppercase">
            Parashikimi për ditën e udhëtimit
          </p>
          <div className="flex justify-between gap-4">
            {slots.map((slot) => {
              const active = slot.hour === activeHour;
              const Icon =
                slot.hour === 20
                  ? Moon
                  : (CONDITION_ICON[slot.condition] ?? Cloud);
              return (
                <div
                  key={slot.hour}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      active ? "text-summit" : "text-summit/35",
                    )}
                  >
                    {String(slot.hour).padStart(2, "0")}:00
                  </span>
                  <Icon
                    className={cn(
                      active
                        ? "text-summit size-[18px]"
                        : "text-summit/50 size-4",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px]",
                      active
                        ? "text-summit font-bold"
                        : "text-summit/50 font-semibold",
                    )}
                  >
                    {slot.temp}°C
                  </span>
                  <span
                    className={cn(
                      "h-0.5 w-5",
                      active ? "bg-moss" : "bg-transparent",
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
