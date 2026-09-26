export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} MIN`;
  return m === 0 ? `${h} ORË` : `${h} ORË ${m} MIN`;
}

export function formatHikeDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

export function formatKm(km: number): string {
  return `${km.toLocaleString("en-US", { maximumFractionDigits: 1 })} KM`;
}
