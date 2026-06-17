import { env } from "@/config/env";

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGust?: number;
  precipitation: number;
  rainProbability: number;
  condition: WeatherCondition;
  conditionDescription: string;
  icon: string;
  forecastFor: Date;
}

export type WeatherCondition =
  | "thunderstorm"
  | "drizzle"
  | "rain"
  | "snow"
  | "mist"
  | "clear"
  | "clouds";

export interface ForecastResult {
  current: WeatherData;
  forecast: WeatherData[];
  fetchedAt: Date;
}

export class WeatherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherError";
  }
}

/** Map an OpenWeatherMap condition code to our simplified condition. */
function mapCondition(code: number): WeatherCondition {
  if (code >= 200 && code < 300) return "thunderstorm";
  if (code >= 300 && code < 400) return "drizzle";
  if (code >= 500 && code < 600) return "rain";
  if (code >= 600 && code < 700) return "snow";
  if (code >= 700 && code < 800) return "mist";
  if (code === 800) return "clear";
  return "clouds";
}

interface OwmEntry {
  dt: number;
  main: { temp: number; feels_like: number; humidity: number };
  weather: { id: number; description: string; icon: string }[];
  wind: { speed: number; gust?: number };
  pop?: number;
  rain?: { "3h"?: number };
}

function parseEntry(entry: OwmEntry): WeatherData {
  const w = entry.weather[0];
  return {
    temperature: Math.round(entry.main.temp),
    feelsLike: Math.round(entry.main.feels_like),
    humidity: entry.main.humidity,
    windSpeed: Math.round(entry.wind.speed * 3.6),
    windGust: entry.wind.gust ? Math.round(entry.wind.gust * 3.6) : undefined,
    precipitation: entry.rain?.["3h"] ?? 0,
    rainProbability: Math.round((entry.pop ?? 0) * 100),
    condition: mapCondition(w?.id ?? 800),
    conditionDescription: w?.description ?? "",
    icon: w?.icon ?? "01d",
    forecastFor: new Date(entry.dt * 1000),
  };
}

/**
 * Fetch current + 5-day forecast for a location via OpenWeatherMap. Responses
 * are cached by Next.js for 3 hours to stay well within the free tier.
 */
export async function getWeatherForLocation(
  lat: number | string,
  lng: number | string,
): Promise<ForecastResult> {
  if (!env.OPENWEATHER_API_KEY) {
    throw new WeatherError("OPENWEATHER_API_KEY is not set.");
  }

  const url =
    `https://api.openweathermap.org/data/2.5/forecast` +
    `?lat=${lat}&lon=${lng}&appid=${env.OPENWEATHER_API_KEY}` +
    `&units=metric&cnt=40`;

  const response = await fetch(url, { next: { revalidate: 10800 } });
  if (!response.ok) {
    throw new WeatherError(
      `OpenWeatherMap returned ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as { list?: OwmEntry[] };
  const list = data.list ?? [];
  if (list.length === 0) {
    throw new WeatherError("No forecast data returned.");
  }

  const entries = list.map(parseEntry);
  const current = entries[0]!;

  // One representative entry per day (midday-ish), next 5 days.
  const byDay = new Map<string, WeatherData>();
  for (const entry of entries) {
    const key = entry.forecastFor.toISOString().slice(0, 10);
    const hour = entry.forecastFor.getHours();
    const existing = byDay.get(key);
    if (!existing || Math.abs(hour - 12) < Math.abs(existing.forecastFor.getHours() - 12)) {
      byDay.set(key, entry);
    }
  }

  return {
    current,
    forecast: Array.from(byDay.values()).slice(0, 5),
    fetchedAt: new Date(),
  };
}
