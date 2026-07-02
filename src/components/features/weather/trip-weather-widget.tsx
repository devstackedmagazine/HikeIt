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
  const sameDay = data.hourly.filter(
    (h) => h.time.toDateString() === tripDate.toDateString(),
  );
  const slots = TARGET_HOURS.map((hour) => {
    const match = sameDay.find((h) => h.time.getHours() === hour);
    return match ? { hour, temp: match.temp, condition: match.condition } : null;
  }).filter((s): s is { hour: number; temp: number; condition: string } => s !== null);

  // Highlight the target hour closest to the trip's start time.
  const tripHour = tripDate.getHours();
  const activeHour = TARGET_HOURS.reduce((best, h) =>
    Math.abs(h - tripHour) < Math.abs(best - tripHour) ? h : best,
  );

  const CurrentIcon = CONDITION_ICON[data.current.condition] ?? Cloud;

  return (
    <div className="grid items-center gap-8 border border-summit/[0.08] bg-summit/[0.03] px-6 py-5 sm:grid-cols-[auto_1fr]">
      {/* Current */}
      <div>
        <p className="mb-2 text-[9px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
          Moti në {locationLabel}
        </p>
        <div className="flex items-center gap-3">
          <span className="font-heading text-[40px] leading-none font-extrabold tracking-[-0.03em] text-summit">
            {data.current.temperature}°C
          </span>
          <CurrentIcon className="size-8 text-summit/60" />
        </div>
      </div>

      {/* Hourly */}
      {slots.length > 0 ? (
        <div>
          <p className="mb-3 text-[9px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
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
                      active ? "size-[18px] text-summit" : "size-4 text-summit/50",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px]",
                      active
                        ? "font-bold text-summit"
                        : "font-semibold text-summit/50",
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
