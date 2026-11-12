import assert from "node:assert/strict";

import {
  leavesClubWithoutAdmin,
  roleAfterOnboarding,
} from "../src/lib/clubs/admin-rules";

/**
 * A club always keeps an active admin, and onboarding never changes a super
 * admin's role (no test runner in this repo yet):
 *
 *   pnpm exec tsx scripts/check-admin-rules.ts
 */
const a = "membership-a";
const b = "membership-b";
const m = "membership-member";

const cases: [string, Parameters<typeof leavesClubWithoutAdmin>[0], boolean][] =
  [
    [
      "only admin demotes or removes themselves → blocked",
      { activeAdminIds: [a], targetId: a, staysAdmin: false },
      true,
    ],
    [
      "one of two admins is demoted → allowed",
      { activeAdminIds: [a, b], targetId: b, staysAdmin: false },
      false,
    ],
    [
      // The racing case: the other admin's demotion committed first, so
      // under the lock only one admin row is left.
      "second of two concurrent demotions sees one admin → blocked",
      { activeAdminIds: [b], targetId: b, staysAdmin: false },
      true,
    ],
    [
      "a member is promoted to admin → allowed",
      { activeAdminIds: [a], targetId: m, staysAdmin: true },
      false,
    ],
    [
      "a member is removed → allowed",
      { activeAdminIds: [a], targetId: m, staysAdmin: false },
      false,
    ],
    [
      "only admin is re-saved as admin → allowed",
      { activeAdminIds: [a], targetId: a, staysAdmin: true },
      false,
    ],
  ];
for (const [name, input, expected] of cases) {
  assert.equal(leavesClubWithoutAdmin(input), expected, name);
  console.log(`ok  ${name}`);
}

assert.equal(roleAfterOnboarding("hiker", "club_admin"), "club_admin");
assert.equal(roleAfterOnboarding("club_admin", "hiker"), "hiker");
assert.equal(roleAfterOnboarding("super_admin", "hiker"), "super_admin");
assert.equal(roleAfterOnboarding("super_admin", "club_admin"), "super_admin");
console.log("ok  onboarding never changes a super admin's role");
