import { parseStringPromise } from "xml2js";

export interface GpxPoint {
  lat: number;
  lng: number;
  elevation?: number;
}

export interface ElevationSample {
  distanceKm: number;
  elevation: number;
}

export interface ParsedGpx {
  name: string;
  description?: string;
  points: GpxPoint[];
  totalDistanceKm: number;
  totalElevationGainM: number;
  totalElevationLossM: number;
  pointCount: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  trackType: "loop" | "out_and_back" | "point_to_point";
  elevationProfile: ElevationSample[];
}

export class GpxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GpxError";
  }
}

const EARTH_RADIUS_M = 6_371_000;
const MAX_GPX_BYTES = 5 * 1024 * 1024;
const MAX_POINTS = 50_000;
const DOWNSAMPLE_TARGET = 5_000;

/** Great-circle distance between two coordinates, in meters. */
function haversine(a: GpxPoint, b: GpxPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Strip DOCTYPE declarations and reject ENTITY definitions to prevent
 * XXE and billion-laughs attacks. xml2js 0.6.2 has no built-in protection.
 */
function sanitizeXml(content: string): string {
  const stripped = content.replace(/<!DOCTYPE[^>]*>/gi, "");
  if (/<!ENTITY/i.test(stripped)) {
    throw new GpxError("Skedari GPX përmban entitete të palejuara.");
  }
  return stripped;
}

interface RawTrkpt {
  $: { lat: string; lon: string };
  ele?: string[];
}

export async function parseGpxString(gpxContent: string): Promise<ParsedGpx> {
  if (gpxContent.length > MAX_GPX_BYTES) {
    throw new GpxError("Skedari GPX tejkalon 5MB.");
  }

  const sanitized = sanitizeXml(gpxContent);

  let parsed: Record<string, unknown>;
  try {
    parsed = await parseStringPromise(sanitized);
  } catch {
    throw new GpxError("Skedari GPX nuk është i vlefshëm.");
  }

  const gpx = (parsed as { gpx?: Record<string, unknown> }).gpx;
  if (!gpx) throw new GpxError("Mungon elementi <gpx>.");

  const trk = (gpx.trk as Record<string, unknown>[] | undefined)?.[0];
  const name =
    (trk?.name as string[] | undefined)?.[0] ??
    ((gpx.metadata as { name?: string[] }[] | undefined)?.[0]?.name?.[0] ??
      "Shteg pa emër");
  const description = (trk?.desc as string[] | undefined)?.[0];

  const segments = (trk?.trkseg as Record<string, unknown>[] | undefined) ?? [];
  const points: GpxPoint[] = [];
  for (const seg of segments) {
    const trkpts = (seg.trkpt as RawTrkpt[] | undefined) ?? [];
    for (const pt of trkpts) {
      const lat = Number(pt.$.lat);
      const lng = Number(pt.$.lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
      const elevation = pt.ele?.[0] ? Number(pt.ele[0]) : undefined;
      points.push({ lat, lng, elevation });
    }
  }

  if (points.length < 2) {
    throw new GpxError("Skedari GPX duhet të ketë të paktën 2 pika.");
  }

  if (points.length > MAX_POINTS) {
    throw new GpxError(
      `Skedari GPX ka ${points.length.toLocaleString()} pika — maksimumi është ${MAX_POINTS.toLocaleString()}.`,
    );
  }

  let cumulative = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let maxDistFromStart = 0;
  const profile: ElevationSample[] = [];
  let lastSample = -1;
  const start = points[0]!;

  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    if (i > 0) {
      cumulative += haversine(points[i - 1]!, p);
      const prevEle = points[i - 1]!.elevation;
      if (p.elevation != null && prevEle != null) {
        const delta = p.elevation - prevEle;
        if (delta > 0) elevationGain += delta;
        else elevationLoss += Math.abs(delta);
      }
    }
    maxDistFromStart = Math.max(maxDistFromStart, haversine(start, p));
    if (p.elevation != null && (lastSample < 0 || cumulative - lastSample >= 200)) {
      profile.push({
        distanceKm: Math.round((cumulative / 1000) * 100) / 100,
        elevation: Math.round(p.elevation),
      });
      lastSample = cumulative;
    }
  }

  const end = points[points.length - 1]!;
  const endToStart = haversine(start, end);

  let trackType: ParsedGpx["trackType"] = "point_to_point";
  if (endToStart < 150) {
    trackType =
      Math.abs(maxDistFromStart * 2 - cumulative) < cumulative * 0.25
        ? "out_and_back"
        : "loop";
  }

  return {
    name,
    description,
    points,
    totalDistanceKm: Math.round((cumulative / 1000) * 100) / 100,
    totalElevationGainM: Math.round(elevationGain),
    totalElevationLossM: Math.round(elevationLoss),
    pointCount: points.length,
    startLat: start.lat,
    startLng: start.lng,
    endLat: end.lat,
    endLng: end.lng,
    trackType,
    elevationProfile: profile,
  };
}

/**
 * Downsample a point array to at most `max` entries for map rendering.
 * Uniform sampling, always keeping first and last point.
 */
export function downsampleTrack(
  points: GpxPoint[],
  max = DOWNSAMPLE_TARGET,
): [number, number][] {
  if (points.length <= max) {
    return points.map((p) => [p.lat, p.lng]);
  }
  const step = (points.length - 1) / (max - 1);
  const result: [number, number][] = [];
  for (let i = 0; i < max; i++) {
    const idx = Math.round(i * step);
    const p = points[idx]!;
    result.push([p.lat, p.lng]);
  }
  return result;
}

export async function parseGpxFile(file: File): Promise<ParsedGpx> {
  const text = await file.text();
  return parseGpxString(text);
}
