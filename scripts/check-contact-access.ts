import assert from "node:assert/strict";

import type { TripRegistration } from "../src/lib/db/schema";
import {
  contactAccess,
  contactVisibleForStatus,
  contactWindow,
} from "../src/lib/trips/contact-access";

/**
 * Who may see participants' phone / emergency contact, and when
 * (no test runner in this repo yet):
 *
 *   pnpm exec tsx scripts/check-contact-access.ts
 */
const start = new Date("2026-11-01T07:00:00Z");
const end = new Date("2026-11-01T15:00:00Z");
const trip = {
  status: "open" as const,
  startDatetime: start,
  endDatetime: end,
};
const at = (iso: string) => new Date(iso);

const cases: [string, Parameters<typeof contactAccess>[0], string][] = [
  [
    "organizer inside window",
    { viewerRole: "organizer", trip, now: at("2026-11-01T06:00:00Z") },
    "allowed",
  ],
  [
    "admin inside window",
    { viewerRole: "admin", trip, now: at("2026-11-02T00:00:00Z") },
    "allowed",
  ],
  [
    "member never",
    { viewerRole: "member", trip, now: at("2026-11-01T06:00:00Z") },
    "not-organiser",
  ],
  [
    "non-member never",
    { viewerRole: null, trip, now: at("2026-11-01T06:00:00Z") },
    "not-organiser",
  ],
  [
    "opens exactly 3 days before start",
    { viewerRole: "organizer", trip, now: at("2026-10-29T07:00:00Z") },
    "allowed",
  ],
  [
    "1 ms before the window",
    { viewerRole: "organizer", trip, now: at("2026-10-29T06:59:59.999Z") },
    "before-window",
  ],
  [
    "closes exactly 2 days after end",
    { viewerRole: "organizer", trip, now: at("2026-11-03T15:00:00Z") },
    "allowed",
  ],
  [
    "1 ms after the window",
    { viewerRole: "organizer", trip, now: at("2026-11-03T15:00:00.001Z") },
    "after-window",
  ],
  [
    "no end time → start + 12 h + 2 days",
    {
      viewerRole: "organizer",
      trip: { ...trip, endDatetime: null },
      now: at("2026-11-03T19:00:00Z"),
    },
    "allowed",
  ],
  [
    "no end time, after that",
    {
      viewerRole: "organizer",
      trip: { ...trip, endDatetime: null },
      now: at("2026-11-03T19:00:00.001Z"),
    },
    "after-window",
  ],
  [
    "canceled trip",
    {
      viewerRole: "admin",
      trip: { ...trip, status: "canceled" },
      now: at("2026-11-01T06:00:00Z"),
    },
    "trip-not-active",
  ],
  [
    "draft trip",
    {
      viewerRole: "admin",
      trip: { ...trip, status: "draft" },
      now: at("2026-11-01T06:00:00Z"),
    },
    "trip-not-active",
  ],
  [
    "completed trip, still in window",
    {
      viewerRole: "organizer",
      trip: { ...trip, status: "completed" },
      now: at("2026-11-02T00:00:00Z"),
    },
    "allowed",
  ],
];

for (const [name, input, expected] of cases) {
  const result = contactAccess(input);
  const got = result.allowed ? "allowed" : result.reason;
  assert.equal(got, expected, name);
  console.log(`ok  ${name}`);
}

const w = contactWindow(trip);
assert.equal(w.opensAt.toISOString(), "2026-10-29T07:00:00.000Z");
assert.equal(w.closesAt.toISOString(), "2026-11-03T15:00:00.000Z");
console.log("ok  window bounds");

// Per-registration: every status in the enum, so a new status fails here
// until someone decides whether it shows contacts. There is no "rejected"
// status; a rejected sign-up is "canceled".
const statusVisible: Record<TripRegistration["status"], boolean> = {
  confirmed: true,
  attended: true,
  no_show: true,
  pending: false,
  waitlisted: false,
  canceled: false,
};
for (const [status, visible] of Object.entries(statusVisible)) {
  assert.equal(
    contactVisibleForStatus(status as TripRegistration["status"]),
    visible,
    status,
  );
  console.log(`ok  status ${status} → ${visible ? "shown" : "hidden"}`);
}
