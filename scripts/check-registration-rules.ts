import assert from "node:assert/strict";

import { decideSignUp } from "../src/lib/trips/registration-rules";

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
    { status: "open", maxParticipants: 10, confirmed: 3 },
    { kind: "confirmed", fillsTrip: false },
  ],
  [
    "open, takes last spot → fills",
    { status: "open", maxParticipants: 10, confirmed: 9 },
    { kind: "confirmed", fillsTrip: true },
  ],
  [
    "open but already at capacity (race) → waitlist",
    { status: "open", maxParticipants: 10, confirmed: 10 },
    { kind: "waitlisted" },
  ],
  [
    "full → waitlist",
    { status: "full", maxParticipants: 10, confirmed: 10 },
    { kind: "waitlisted" },
  ],
  [
    "full and over capacity → waitlist, never confirmed",
    { status: "full", maxParticipants: 10, confirmed: 12 },
    { kind: "waitlisted" },
  ],
  [
    "full but a spot freed → confirmed",
    { status: "full", maxParticipants: 10, confirmed: 9 },
    { kind: "confirmed", fillsTrip: true },
  ],
  [
    "no limit",
    { status: "open", maxParticipants: null, confirmed: 500 },
    { kind: "confirmed", fillsTrip: false },
  ],
  [
    "draft is closed",
    { status: "draft", maxParticipants: 10, confirmed: 0 },
    { kind: "closed" },
  ],
  [
    "canceled is closed",
    { status: "canceled", maxParticipants: 10, confirmed: 0 },
    { kind: "closed" },
  ],
  [
    "completed is closed",
    { status: "completed", maxParticipants: 10, confirmed: 0 },
    { kind: "closed" },
  ],
  [
    "in_progress is closed",
    { status: "in_progress", maxParticipants: 10, confirmed: 0 },
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
    const d = decideSignUp({ status: "open", maxParticipants: max, confirmed });
    if (d.kind === "confirmed") assert.ok(confirmed + 1 <= max, `max ${max}`);
  }
}
console.log("ok  never exceeds capacity (max 1..30)");
