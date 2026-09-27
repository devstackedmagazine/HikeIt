import {
  downsampleTrack,
  GpxError,
  type GpxPoint,
  haversine,
  type ParsedGpx,
} from "@/lib/gpx/parser";

/**
 * Personal-hike rules layered on top of `parseGpxString`. Pure and
 * dependency-free so the upload form can show exactly what the server will
 * store, and the server re-runs it on the raw file — never trusting the
 * client's numbers.
 *
 * Stats come from the FULL track; only the stored map line is trimmed.
 * Motorised legs (cable car, bus, the drive home) are excluded from distance
 * and elevation gain but not from elapsed duration.
 */

/** Along-track distance trimmed from each end of the render cache. */
const PRIVACY_TRIM_M = 200;
/** Ignore elevation changes smaller than this — GPS/barometer noise. */
const ELEVATION_NOISE_M = 3;
const MIN_DISTANCE_KM = 0.1;
/** Clock-drift allowance before a start time counts as "in the future". */
const FUTURE_TOLERANCE_MS = 10 * 60 * 1000;
/** Anything earlier is a device with an unset clock, not a real date. */
const EARLIEST_VALID = Date.UTC(2000, 0, 1);
/**
 * A segment moving faster than this is transport, not walking, and is
 * excluded from distance and elevation gain. Gondolas and slow buses can run
 * below it and will be counted — the cutoff errs toward keeping real running.
 */
const MAX_WALKING_KMH = 25;
/**
 * Speed is judged over at least this much time, not per point pair: at 1s
 * sampling a few meters of GPS jitter reads as 25+ km/h and would chip away
 * at genuine walking distance.
 */
const SPEED_WINDOW_MS = 10_000;
/**
 * After excluding fast segments, a whole-track average above this still
 * can't be walking — typically a bike ride at 15–25 km/h.
 */
const MAX_AVG_KMH = 15;
/** Map line points per hike — the list renders many at once. */
const RENDER_POINTS = 1_000;

export interface HikeAnalysis {
  name: string;
  hikedAt: Date;
  distanceKm: number;
  elevationGainM: number;
  durationMin: number;
  /** Distance left out as transport (> MAX_WALKING_KMH), for display. */
  excludedKm: number;
  /** Trimmed + downsampled [lat, lng] — what gets stored and rendered. */
  track: [number, number][];
}

const TOO_FAST_MESSAGE =
  "Shpejtësia mesatare e kësaj gjurme është shumë e lartë për ecje — duket si udhëtim me biçikletë ose automjet. Ngarko vetëm gjurmë ecjesh.";

/**
 * Elevation gain with a noise threshold: a rise only counts once it clears
 * `ELEVATION_NOISE_M` above the last reference point, so jitter on flat
 * ground doesn't accumulate into hundreds of phantom meters. Arriving via a
 * fast segment re-anchors without counting — a cable car's climb isn't hiked.
 */
function elevationGain(points: GpxPoint[], fast: boolean[]): number {
  let gain = 0;
  let ref: number | undefined;
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    if (p.elevation == null || Number.isNaN(p.elevation)) continue;
    if (ref == null || fast[i]) {
      ref = p.elevation;
      continue;
    }
    const delta = p.elevation - ref;
    if (delta >= ELEVATION_NOISE_M) {
      gain += delta;
      ref = p.elevation;
    } else if (delta <= -ELEVATION_NOISE_M) {
      ref = p.elevation;
    }
  }
  return Math.round(gain);
}

/** Drop points until `meters` of along-track distance has been covered. */
function trimFront(points: GpxPoint[], meters: number): GpxPoint[] {
  let covered = 0;
  for (let i = 1; i < points.length; i++) {
    covered += haversine(points[i - 1]!, points[i]!);
    if (covered >= meters) return points.slice(i);
  }
  return [];
}

/**
 * Remove ~`PRIVACY_TRIM_M` from both ends so the line doesn't start at the
 * user's door. Deliberately modest: a loop or a start a few hundred meters
 * from home can still hint at it — the privacy copy must not overpromise.
 */
export function trimTrackEnds(points: GpxPoint[]): GpxPoint[] {
  const front = trimFront(points, PRIVACY_TRIM_M);
  return trimFront([...front].reverse(), PRIVACY_TRIM_M).reverse();
}

/** Straight-line speed between two timed points, km/h. */
function speedKmh(a: GpxPoint, b: GpxPoint): number {
  const ms = b.time! - a.time!;
  const meters = haversine(a, b);
  if (ms <= 0) return meters > 0 ? Number.POSITIVE_INFINITY : 0;
  return meters / 1000 / (ms / 3_600_000);
}

/**
 * `fast[i]` is true when the segment arriving at point i (from i-1) is
 * transport.
 *
 * Speed is straight-line displacement over a window of at least
 * `SPEED_WINDOW_MS`, not path length: GPS jitter zigzags around a slow walker
 * without displacing them, while a vehicle covers the ground in a line. The
 * window is taken both forward from i-1 and backward from i, and either one
 * being fast marks the segment — otherwise the last few seconds of a cable
 * car get averaged with the walk that follows and leak into the totals.
 * Segments without timestamps can't be judged and count as walking.
 */
function fastSegments(points: GpxPoint[]): boolean[] {
  const fast = new Array<boolean>(points.length).fill(false);
  const n = points.length;
  for (let i = 1; i < n; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    if (a.time == null || b.time == null) continue;

    let f = i;
    while (f < n - 1 && (points[f]!.time == null || points[f]!.time! - a.time < SPEED_WINDOW_MS)) f++;
    let r = i - 1;
    while (r > 0 && (points[r]!.time == null || b.time - points[r]!.time! < SPEED_WINDOW_MS)) r--;

    const forward = points[f]!.time != null ? speedKmh(a, points[f]!) : 0;
    const backward = points[r]!.time != null ? speedKmh(points[r]!, b) : 0;
    fast[i] = Math.max(forward, backward) > MAX_WALKING_KMH;
  }
  return fast;
}

/**
 * Validate a parsed GPX as a completed personal hike and derive its stats.
 * Throws `GpxError` with an Albanian message on any rejection.
 */
export function analyzeHike(
  parsed: ParsedGpx,
  now: number = Date.now(),
): HikeAnalysis {
  const timed = parsed.points.filter((p) => p.time != null);
  const first = timed[0]?.time;
  const last = timed[timed.length - 1]?.time;
  // No timestamps — or every point stamped with the same export time — means
  // this was drawn in a planner, not walked.
  if (timed.length < 2 || first == null || last == null || last - first < 60_000) {
    throw new GpxError(
      "Ky skedar GPX nuk ka kohë të regjistruara për pikat e gjurmës, prandaj duket si një rrugë e planifikuar, jo si një ecje e kryer. Ngarko gjurmën e regjistruar nga ora ose aplikacioni yt GPS gjatë ecjes.",
    );
  }

  if (first > now + FUTURE_TOLERANCE_MS) {
    throw new GpxError("Data e ecjes është në të ardhmen. Kontrollo skedarin GPX.");
  }
  if (first < EARLIEST_VALID) {
    throw new GpxError(
      "Data e ecjes duket e pavlefshme — ora e pajisjes mund të mos ketë qenë e caktuar.",
    );
  }

  const points = parsed.points;
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1]! + haversine(points[i - 1]!, points[i]!));
  }
  const fast = fastSegments(points);
  let walkedM = 0;
  for (let i = 1; i < points.length; i++) {
    if (!fast[i]) walkedM += cum[i]! - cum[i - 1]!;
  }
  const round2 = (m: number) => Math.round(m / 10) / 100;
  const distanceKm = round2(walkedM);
  const excludedKm = round2(cum[cum.length - 1]! - walkedM);

  // An all-transport track lands here too: nothing walked is left.
  if (distanceKm < MIN_DISTANCE_KM) {
    throw new GpxError("Gjurma është shumë e shkurtër për t'u regjistruar si ecje.");
  }

  // Elapsed time, transport legs included.
  const durationMs = last - first;
  if (distanceKm / (durationMs / 3_600_000) > MAX_AVG_KMH) {
    throw new GpxError(TOO_FAST_MESSAGE);
  }

  return {
    name: parsed.name,
    hikedAt: new Date(first),
    distanceKm,
    excludedKm,
    elevationGainM: elevationGain(points, fast),
    durationMin: Math.max(1, Math.round(durationMs / 60_000)),
    track: downsampleTrack(trimTrackEnds(points), RENDER_POINTS),
  };
}
