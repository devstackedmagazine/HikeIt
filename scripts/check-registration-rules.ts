import assert from "node:assert/strict";

import {
  CANCEL_AFTER_START_ERROR,
  decideSignUp,
  hikerCanCancel,
  isAdminSettableStatus,
  rosterStatus,
  waitlistPromotions,
} from "../src/lib/trips/registration-rules";

/**
 * Capacity rules for self-registration (no test runner in this repo yet):
 *
 *   pnpm exec tsx scripts/check-registration-rules.ts
 */
const cases: [
  string,
  Parameters<typeof decideSignUp>[0],
  ReturnType<typeof decideSignUp>,
][] = [
  [
    "open, spots left",
    { status: "open", maxParticipants: 10, confirmed: 3, waitlisted: 0 },
    { kind: "confirmed", fillsTrip: false },
  ],
  [
    "open, takes last spot → fills",
    { status: "open", maxParticipants: 10, confirmed: 9, waitlisted: 0 },
    { kind: "confirmed", fillsTrip: true },
  ],
  [
    "open but already at capacity (race) → waitlist",
    { status: "open", maxParticipants: 10, confirmed: 10, waitlisted: 0 },
    { kind: "waitlisted" },
  ],
  [
    "full → waitlist",
    { status: "full", maxParticipants: 10, confirmed: 10, waitlisted: 0 },
    { kind: "waitlisted" },
  ],
  [
    "full and over capacity → waitlist, never confirmed",
    { status: "full", maxParticipants: 10, confirmed: 12, waitlisted: 0 },
    { kind: "waitlisted" },
  ],
  [
    "full but a spot freed → confirmed",
    { status: "full", maxParticipants: 10, confirmed: 9, waitlisted: 0 },
    { kind: "confirmed", fillsTrip: true },
  ],
  [
    "spot freed but people are waiting → joins the waitlist, no queue-jump",
    { status: "open", maxParticipants: 10, confirmed: 9, waitlisted: 2 },
    { kind: "waitlisted" },
  ],
  [
    "full, spot freed, people waiting → waitlist",
    { status: "full", maxParticipants: 10, confirmed: 9, waitlisted: 1 },
    { kind: "waitlisted" },
  ],
  [
    "no limit, stale waitlist → still confirmed",
    { status: "open", maxParticipants: null, confirmed: 3, waitlisted: 2 },
    { kind: "confirmed", fillsTrip: false },
  ],
  [
    "no limit",
    { status: "open", maxParticipants: null, confirmed: 500, waitlisted: 0 },
    { kind: "confirmed", fillsTrip: false },
  ],
  [
    "draft is closed",
    { status: "draft", maxParticipants: 10, confirmed: 0, waitlisted: 0 },
    { kind: "closed" },
  ],
  [
    "canceled is closed",
    { status: "canceled", maxParticipants: 10, confirmed: 0, waitlisted: 0 },
    { kind: "closed" },
  ],
  [
    "completed is closed",
    { status: "completed", maxParticipants: 10, confirmed: 0, waitlisted: 0 },
    { kind: "closed" },
  ],
  [
    "in_progress is closed",
    { status: "in_progress", maxParticipants: 10, confirmed: 0, waitlisted: 0 },
    { kind: "closed" },
  ],
];

for (const [name, input, expected] of cases) {
  assert.deepEqual(decideSignUp(input), expected, name);
  console.log(`ok  ${name}`);
}

// A confirmation never brings the confirmed count above the limit.
for (let max = 1; max <= 30; max++) {
  for (let confirmed = 0; confirmed <= max + 3; confirmed++) {
    const d = decideSignUp({
      status: "open",
      maxParticipants: max,
      confirmed,
      waitlisted: 0,
    });
    if (d.kind === "confirmed") assert.ok(confirmed + 1 <= max, `max ${max}`);
  }
}
console.log("ok  never exceeds capacity (max 1..30)");

// An organiser can set only these by hand; anything else is refused before
// the capacity check (a crafted "attended" would have skipped it).
for (const ok of ["confirmed", "waitlisted", "canceled"]) {
  assert.equal(isAdminSettableStatus(ok), true, ok);
}
for (const bad of ["attended", "no_show", "pending", "", null, undefined, 1]) {
  assert.equal(isAdminSettableStatus(bad), false, String(bad));
}
console.log("ok  only confirmed / waitlisted / canceled can be set by hand");

// Waitlist promotion: freed spots go to the people waiting, never past the
// limit, and not once the trip has started or stopped taking people.
const open = { status: "open" as const, started: false };
const promotions: [string, Parameters<typeof waitlistPromotions>[0], number][] =
  [
    [
      "one spot freed, three waiting → one promoted",
      { ...open, maxParticipants: 10, confirmed: 9, waitlisted: 3 },
      1,
    ],
    [
      "limit raised 10 → 13, two waiting → both promoted",
      { ...open, maxParticipants: 13, confirmed: 10, waitlisted: 2 },
      2,
    ],
    [
      "limit raised 10 → 12, five waiting → two promoted",
      {
        ...open,
        status: "full",
        maxParticipants: 12,
        confirmed: 10,
        waitlisted: 5,
      },
      2,
    ],
    [
      "limit removed → everyone waiting is promoted",
      { ...open, maxParticipants: null, confirmed: 10, waitlisted: 4 },
      4,
    ],
    [
      "still full → nobody",
      { ...open, maxParticipants: 10, confirmed: 10, waitlisted: 3 },
      0,
    ],
    [
      "over the limit → nobody",
      { ...open, maxParticipants: 10, confirmed: 12, waitlisted: 3 },
      0,
    ],
    [
      "nobody waiting → nobody",
      { ...open, maxParticipants: 10, confirmed: 4, waitlisted: 0 },
      0,
    ],
    [
      "trip already started → nobody",
      {
        ...open,
        started: true,
        maxParticipants: 10,
        confirmed: 9,
        waitlisted: 3,
      },
      0,
    ],
    [
      "canceled trip → nobody",
      {
        ...open,
        status: "canceled",
        maxParticipants: 10,
        confirmed: 9,
        waitlisted: 3,
      },
      0,
    ],
  ];
for (const [name, input, expected] of promotions) {
  assert.equal(waitlistPromotions(input), expected, name);
  console.log(`ok  ${name}`);
}

for (let max = 1; max <= 20; max++) {
  for (let confirmed = 0; confirmed <= max + 2; confirmed++) {
    for (let waitlisted = 0; waitlisted <= max + 2; waitlisted++) {
      const n = waitlistPromotions({
        ...open,
        maxParticipants: max,
        confirmed,
        waitlisted,
      });
      assert.ok(n >= 0 && n <= waitlisted, "promotes only people waiting");
      assert.ok(confirmed + n <= Math.max(max, confirmed), `max ${max}`);
      // No free spot is left while someone is still waiting.
      if (confirmed + n < max) assert.equal(n, waitlisted);
    }
  }
}
console.log("ok  promotion never exceeds capacity and leaves no gap");

const full = { started: false, maxParticipants: 10 };
assert.equal(rosterStatus({ ...full, status: "full", confirmed: 9 }), "open");
assert.equal(rosterStatus({ ...full, status: "open", confirmed: 10 }), "full");
assert.equal(rosterStatus({ ...full, status: "full", confirmed: 10 }), "full");
assert.equal(
  rosterStatus({
    status: "full",
    started: false,
    maxParticipants: null,
    confirmed: 50,
  }),
  "open",
);
assert.equal(
  rosterStatus({ ...full, status: "full", started: true, confirmed: 3 }),
  "full",
  "a started trip is not reopened",
);
assert.equal(
  rosterStatus({ ...full, status: "canceled", confirmed: 3 }),
  "canceled",
);
console.log("ok  open / full follows the confirmed count");

// A hiker cancels until the trip starts, not after. Starts are instants, so
// 08:00 in Kosovo is 07:00 UTC in winter and 06:00 UTC in summer.
const winterStart = new Date("2026-11-15T08:00:00+01:00");
const summerStart = new Date("2026-07-12T08:00:00+02:00");
const at = (iso: string) => new Date(iso);
assert.equal(hikerCanCancel(winterStart, at("2026-11-15T06:59:59Z")), true);
assert.equal(hikerCanCancel(winterStart, at("2026-11-15T07:00:00Z")), false);
assert.equal(hikerCanCancel(winterStart, at("2026-11-15T09:30:00Z")), false);
assert.equal(hikerCanCancel(summerStart, at("2026-07-12T05:59:59Z")), true);
assert.equal(hikerCanCancel(summerStart, at("2026-07-12T06:00:00Z")), false);
assert.equal(hikerCanCancel(winterStart, at("2026-11-14T20:00:00Z")), true);
assert.match(CANCEL_AFTER_START_ERROR, /Udhëtimi ka filluar/);
console.log("ok  a hiker can cancel until the start in Kosovo time, not after");
