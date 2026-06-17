/** Long Albanian date+time, e.g. "12 korrik 2026, 08:00". */
export function formatTripDateTime(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Short Albanian date, e.g. "12 korr 2026". */
export function formatTripDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toCalendarStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
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
