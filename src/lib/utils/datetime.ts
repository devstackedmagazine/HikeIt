/**
 * Every trip time in HikeIt is a Kosovo wall-clock time. Stored values are
 * real instants (timestamptz); this zone is used to read form input and to
 * display them, so nothing depends on the server's own time zone (Vercel
 * runs in UTC). Europe/Belgrade is the IANA zone Kosovo follows: UTC+1 in
 * winter, UTC+2 in summer (last Sunday of March → last Sunday of October).
 */
export const APP_TIME_ZONE = "Europe/Belgrade";

interface WallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** The Kosovo wall-clock reading of an instant. */
export function wallTimeOf(date: Date): WallTime {
  const parts: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year ?? 0,
    month: parts.month ?? 0,
    day: parts.day ?? 0,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

/** Milliseconds the zone is ahead of UTC at `instant` (3600000 or 7200000). */
function zoneOffsetMs(instant: number): number {
  const w = wallTimeOf(new Date(instant));
  const asUtc = Date.UTC(
    w.year,
    w.month - 1,
    w.day,
    w.hour,
    w.minute,
    w.second,
  );
  return asUtc - (instant - (instant % 1000));
}

const WALL_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Read a `<input type="datetime-local">` value ("2026-11-01T08:00") as Kosovo
 * time and return the real instant. DST-aware via the IANA zone, never a fixed
 * offset. At the autumn change, an hour that happens twice (02:00–02:59 on the
 * last Sunday of October) resolves to the first, summer-time occurrence; at
 * the spring change, a time that doesn't exist (02:00–02:59 on the last Sunday
 * of March) resolves an hour later, as a clock would read once it jumps.
 * Returns null for anything that isn't a well-formed wall time.
 */
export function fromKosovoWallTime(value: string): Date | null {
  const m = WALL_TIME_RE.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi, se] = m.slice(1).map((v) => Number(v ?? 0)) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || se > 59) {
    return null;
  }
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, se);
  if (Number.isNaN(asUtc)) return null;
  // Two candidates: the wall time read with the offset in force just before
  // and just after it. Prefer the earlier one whose wall time round-trips.
  const offsets = [
    zoneOffsetMs(asUtc - 12 * 60 * 60 * 1000),
    zoneOffsetMs(asUtc + 12 * 60 * 60 * 1000),
  ];
  const candidates = [...new Set(offsets)]
    .map((off) => asUtc - off)
    .sort((a, b) => a - b);
  for (const c of candidates) {
    const w = wallTimeOf(new Date(c));
    if (
      w.year === y &&
      w.month === mo &&
      w.day === d &&
      w.hour === h &&
      w.minute === mi
    ) {
      return new Date(c);
    }
  }
  // Nonexistent (spring-forward gap): use the pre-change offset, which lands
  // one hour later on the wall clock.
  return new Date(asUtc - Math.min(...offsets));
}

const pad = (n: number) => String(n).padStart(2, "0");

/** An instant as a `datetime-local` value in Kosovo time, e.g. "2026-11-01T08:00". */
export function toKosovoInputValue(date: Date): string {
  const w = wallTimeOf(date);
  return `${w.year}-${pad(w.month)}-${pad(w.day)}T${pad(w.hour)}:${pad(w.minute)}`;
}

/** Kosovo calendar day of an instant, "YYYY-MM-DD" — for same-day checks. */
export function kosovoDateKey(date: Date): string {
  const w = wallTimeOf(date);
  return `${w.year}-${pad(w.month)}-${pad(w.day)}`;
}

/** Long Albanian date+time in Kosovo time, e.g. "12 korrik 2026, 08:00". */
export function formatTripDateTime(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    // sq-AL defaults to a 12-hour clock ("07:00 p.d."), which reads as
    // morning to most people here.
    hourCycle: "h23",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

/** Short Albanian date in Kosovo time, e.g. "12 korr 2026". */
export function formatTripDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

/** Relative time in Albanian, e.g. "2 orë më parë". */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "tani";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min më parë`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} orë më parë`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ditë më parë`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} javë më parë`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} muaj më parë`;
  return `${Math.floor(days / 365)} vjet më parë`;
}

function toCalendarStamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Google Calendar "add event" URL for a trip. */
export function googleCalendarUrl({
  title,
  start,
  end,
  details,
  location,
}: {
  title: string;
  start: Date;
  end?: Date | null;
  details?: string;
  location?: string;
}): string {
  const endDate = end ?? new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toCalendarStamp(start)}/${toCalendarStamp(endDate)}`,
  });
  if (details) params.set("details", details);
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
