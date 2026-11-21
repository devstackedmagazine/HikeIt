import assert from "node:assert/strict";

import { canInviteAs } from "../src/lib/validations/club";

/**
 * Who may invite into which club role (no test runner in this repo yet):
 *
 *   pnpm exec tsx scripts/check-invite-roles.ts
 */
const cases: [string, unknown, unknown, boolean][] = [
  ["admin invites a member", "admin", "member", true],
  ["admin invites an organizer", "admin", "organizer", true],
  ["organizer invites a member", "organizer", "member", true],
  ["organizer invites an organizer → refused", "organizer", "organizer", false],
  ["nobody is invited as admin (admin asks)", "admin", "admin", false],
  ["nobody is invited as admin (organizer asks)", "organizer", "admin", false],
  ["a member invites nobody", "member", "member", false],
  ["a member invites nobody as organizer", "member", "organizer", false],
  ["no membership", null, "member", false],
  ["crafted role value", "admin", "owner", false],
  ["crafted role type", "admin", ["organizer"], false],
];

for (const [name, inviter, role, expected] of cases) {
  assert.equal(canInviteAs(inviter, role), expected, name);
  console.log(`ok  ${name}`);
}
