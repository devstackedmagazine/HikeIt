import type { WeatherData } from "@/lib/weather/client";

export type AlertLevel = "clear" | "warning" | "alert" | "danger";
export type AlertCondition = "wind" | "rain" | "temperature" | "thunderstorm";

export interface AlertResult {
  level: AlertLevel;
  condition: AlertCondition | null;
  value: number;
  threshold: number;
  message: string;
}

const THRESHOLDS = {
  wind: { warning: 40, alert: 60, danger: 80 },
  rain: { warning: 50, alert: 70, danger: 90 },
  temperature: { warning: 5, alert: 0, danger: -10 },
};

const LEVEL_RANK: Record<AlertLevel, number> = {
  clear: 0,
  warning: 1,
  alert: 2,
  danger: 3,
};

/** Highest-severity alert for the given weather, with an Albanian message. */
export function evaluateWeatherAlert(weather: WeatherData): AlertResult {
  const candidates: AlertResult[] = [];

  if (weather.condition === "thunderstorm") {
    candidates.push({
      level: "danger",
      condition: "thunderstorm",
      value: 1,
      threshold: 1,
      message: "Stuhi me vetëtima pritet — udhëtimi NUK rekomandohet",
    });
  }

  const windLevel = levelForAscending(weather.windSpeed, THRESHOLDS.wind);
  if (windLevel) {
    candidates.push({
      level: windLevel,
      condition: "wind",
      value: weather.windSpeed,
      threshold: THRESHOLDS.wind[windLevel],
      message: `Erë e fortë (${weather.windSpeed} km/h) pritet gjatë udhëtimit`,
    });
  }

  const rainLevel = levelForAscending(weather.rainProbability, THRESHOLDS.rain);
  if (rainLevel) {
    candidates.push({
      level: rainLevel,
      condition: "rain",
      value: weather.rainProbability,
      threshold: THRESHOLDS.rain[rainLevel],
      message: `Shi i fortë pritet (${weather.rainProbability}% probabilitet)`,
    });
  }

  const tempLevel = levelForDescending(
    weather.temperature,
    THRESHOLDS.temperature,
  );
  if (tempLevel) {
    candidates.push({
      level: tempLevel,
      condition: "temperature",
      value: weather.temperature,
      threshold: THRESHOLDS.temperature[tempLevel],
      message: `Temperaturë shumë e ulët (${weather.temperature}°C)`,
    });
  }

  if (candidates.length === 0) {
    return {
      level: "clear",
      condition: null,
      value: 0,
      threshold: 0,
      message: "Kushte të mira për udhëtim",
    };
  }

  return candidates.reduce((highest, c) =>
    LEVEL_RANK[c.level] > LEVEL_RANK[highest.level] ? c : highest,
  );
}

/** Higher value = worse (wind, rain). */
function levelForAscending(
  value: number,
  t: { warning: number; alert: number; danger: number },
): Exclude<AlertLevel, "clear"> | null {
  if (value >= t.danger) return "danger";
  if (value >= t.alert) return "alert";
  if (value >= t.warning) return "warning";
  return null;
}

/** Lower value = worse (temperature). */
function levelForDescending(
  value: number,
  t: { warning: number; alert: number; danger: number },
): Exclude<AlertLevel, "clear"> | null {
  if (value <= t.danger) return "danger";
  if (value <= t.alert) return "alert";
  if (value <= t.warning) return "warning";
  return null;
}
