import assert from "node:assert/strict";

import {
  formatTripDateTime,
  fromKosovoWallTime,
  googleCalendarUrl,
  kosovoDateKey,
  toKosovoInputValue,
} from "../src/lib/utils/datetime";

/**
 * Kosovo wall time ↔ UTC instant, including both DST changes. Must pass
 * whatever the machine's own zone is:
 *
 *   TZ=UTC pnpm exec tsx scripts/check-trip-times.ts
 *   TZ=America/New_York pnpm exec tsx scripts/check-trip-times.ts
 */
const iso = (wall: string) => fromKosovoWallTime(wall)?.toISOString();

const cases: [string, string, string][] = [
  // [name, form input, expected UTC instant]
  ["winter (UTC+1)", "2026-11-01T08:00", "2026-11-01T07:00:00.000Z"],
  ["summer (UTC+2)", "2026-07-12T08:00", "2026-07-12T06:00:00.000Z"],
  ["midnight in winter", "2027-01-01T00:30", "2026-12-31T23:30:00.000Z"],
  // Spring change 2026-03-29: 02:00 CET → 03:00 CEST.
  ["just before spring change", "2026-03-29T01:59", "2026-03-29T00:59:00.000Z"],
  [
    "spring gap 02:30 → reads as 03:30",
    "2026-03-29T02:30",
    "2026-03-29T01:30:00.000Z",
  ],
  ["just after spring change", "2026-03-29T03:00", "2026-03-29T01:00:00.000Z"],
  // Autumn change 2026-10-25: 03:00 CEST → 02:00 CET (02:xx happens twice).
  ["just before autumn change", "2026-10-25T01:59", "2026-10-24T23:59:00.000Z"],
  [
    "autumn repeated 02:30 → first (summer) one",
    "2026-10-25T02:30",
    "2026-10-25T00:30:00.000Z",
  ],
  ["just after autumn change", "2026-10-25T03:00", "2026-10-25T02:00:00.000Z"],
  ["seconds accepted", "2026-11-01T08:00:30", "2026-11-01T07:00:30.000Z"],
];
for (const [name, wall, expected] of cases) {
  assert.equal(iso(wall), expected, name);
  console.log(`ok  ${name}: ${wall} → ${expected}`);
}

for (const bad of [
  "",
  "2026-11-01",
  "2026-13-01T08:00",
  "08:00",
  "2026-11-01T24:00",
  "x",
]) {
  assert.equal(fromKosovoWallTime(bad), null, `rejects ${JSON.stringify(bad)}`);
}
console.log("ok  malformed input rejected");

// Edit form round trip: what the organiser typed comes back unchanged.
for (const wall of [
  "2026-11-01T08:00",
  "2026-07-12T08:00",
  "2026-03-29T03:00",
  "2026-10-25T01:59",
  "2026-10-25T03:00",
]) {
  assert.equal(
    toKosovoInputValue(fromKosovoWallTime(wall)!),
    wall,
    `round trip ${wall}`,
  );
}
console.log("ok  edit form round trip");

// Display and calendar.
// ICU's exact separator ("," vs "në") varies by version; check the parts.
const winter = formatTripDateTime(new Date("2026-11-01T07:00:00Z"));
assert.ok(/^1 nëntor 2026\b.*\b08:00$/.test(winter), winter);
const summer = formatTripDateTime(new Date("2026-07-12T06:00:00Z"));
assert.ok(/^12 korrik 2026\b.*\b08:00$/.test(summer), summer);
assert.equal(kosovoDateKey(new Date("2026-12-31T23:30:00Z")), "2027-01-01");
const cal = googleCalendarUrl({
  title: "Test",
  start: fromKosovoWallTime("2026-11-01T08:00")!,
});
assert.ok(cal.includes("dates=20261101T070000Z%2F20261101T100000Z"), cal);
console.log("ok  display in Kosovo time, 24h; calendar link in UTC");
