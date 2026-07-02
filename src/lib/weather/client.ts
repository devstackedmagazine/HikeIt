/**
 * Open-Meteo weather client — free, no API key, no account. Their terms require
 * attribution ("Të dhënat nga Open-Meteo.com"), shown in the weather widget.
 */
const BASE_URL = "https://api.open-meteo.com/v1/forecast";

/** WMO weather code → simplified condition string. */
export function wmoToCondition(code: number): string {
  if (code === 0) return "clear";
  if (code <= 3) return "clouds";
  if (code <= 49) return "mist";
  if (code <= 59) return "drizzle";
  if (code <= 69) return "rain";
  if (code <= 79) return "snow";
  if (code <= 82) return "rain";
  if (code <= 86) return "snow";
  if (code <= 99) return "thunderstorm";
  return "clear";
}

/** WMO weather code → Albanian description. */
export function wmoToAlbanianDescription(code: number): string {
  if (code === 0) return "Qiell i kthjellët";
  if (code <= 3) return "Vranësira";
  if (code <= 49) return "Mjegull";
  if (code <= 59) return "Shiu i imët";
  if (code <= 69) return "Shi";
  if (code <= 79) return "Borë";
  if (code <= 82) return "Shira të rrëmbyeshme";
  if (code <= 86) return "Reshje bore intensive";
  if (code <= 99) return "Stuhi me vetëtima";
  return "E panjohur";
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  precipitation: number;
  rainProbability: number;
  condition: string;
  conditionDescription: string;
  forecastFor: Date;
}

export interface DailyForecast {
  date: Date;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  windSpeedMax: number;
  condition: string;
  conditionDescription: string;
}

export interface HourlyForecast {
  time: Date;
  temp: number;
  condition: string;
}

export interface ForecastResult {
  current: WeatherData;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  fetchedAt: Date;
}

export class WeatherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherError";
  }
}

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    windspeed_10m: number[];
    windgusts_10m: number[];
    weathercode: number[];
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    windspeed_10m_max: number[];
  };
}

export async function getWeatherForLocation(
  lat: number | string,
  lng: number | string,
): Promise<ForecastResult> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly:
      "temperature_2m,precipitation_probability,precipitation,windspeed_10m,windgusts_10m,weathercode",
    daily:
      "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max",
    timezone: "Europe/Belgrade",
    forecast_days: "5",
  });

  const response = await fetch(`${BASE_URL}?${params}`, {
    next: { revalidate: 10800 },
  });
  if (!response.ok) {
    throw new WeatherError(`Open-Meteo API error: ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;

  const now = new Date();
  const idx = Math.max(
    0,
    data.hourly.time.findIndex((t) => new Date(t) >= now),
  );

  const current: WeatherData = {
    temperature: Math.round(data.hourly.temperature_2m[idx] ?? 0),
    feelsLike: Math.round(
      (data.hourly.temperature_2m[idx] ?? 0) -
        (data.hourly.windspeed_10m[idx] ?? 0) * 0.3,
    ),
    humidity: 0,
    windSpeed: Math.round(data.hourly.windspeed_10m[idx] ?? 0),
    windGust: Math.round(data.hourly.windgusts_10m[idx] ?? 0),
    precipitation: data.hourly.precipitation[idx] ?? 0,
    rainProbability: data.hourly.precipitation_probability[idx] ?? 0,
    condition: wmoToCondition(data.hourly.weathercode[idx] ?? 0),
    conditionDescription: wmoToAlbanianDescription(
      data.hourly.weathercode[idx] ?? 0,
    ),
    forecastFor: new Date(data.hourly.time[idx] ?? now),
  };

  const daily: DailyForecast[] = data.daily.time.map((date, i) => ({
    date: new Date(date),
    tempMax: Math.round(data.daily.temperature_2m_max[i] ?? 0),
    tempMin: Math.round(data.daily.temperature_2m_min[i] ?? 0),
    precipitationSum: data.daily.precipitation_sum[i] ?? 0,
    windSpeedMax: Math.round(data.daily.windspeed_10m_max[i] ?? 0),
    condition: wmoToCondition(data.daily.weathercode[i] ?? 0),
    conditionDescription: wmoToAlbanianDescription(
      data.daily.weathercode[i] ?? 0,
    ),
  }));

  const hourly: HourlyForecast[] = data.hourly.time.map((time, i) => ({
    time: new Date(time),
    temp: Math.round(data.hourly.temperature_2m[i] ?? 0),
    condition: wmoToCondition(data.hourly.weathercode[i] ?? 0),
  }));

  return { current, daily, hourly, fetchedAt: now };
}
