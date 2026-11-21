import assert from "node:assert/strict";

import { isCronAuthorized } from "../src/lib/security/cron-auth";
import { scrubQueryParams } from "../src/lib/sentry/scrub";

/**
 * Cron auth and error scrubbing (no test runner in this repo yet). Fake
 * values only:
 *
 *   pnpm exec tsx scripts/check-cron-logs.ts
 */
const secret = "fake-cron-secret-for-tests";

assert.equal(isCronAuthorized(`Bearer ${secret}`, secret), true);
for (const header of [
  null,
  "",
  secret,
  `bearer ${secret}`,
  `Bearer ${secret} `,
  `Bearer ${secret.slice(0, -1)}`,
  `Bearer ${secret}x`,
  "Bearer ",
  "Bearer undefined",
]) {
  assert.equal(isCronAuthorized(header, secret), false, String(header));
}
// No secret configured: nothing is ever authorized, not even "Bearer undefined".
for (const missing of [undefined, ""]) {
  assert.equal(isCronAuthorized("Bearer undefined", missing), false);
  assert.equal(isCronAuthorized("Bearer ", missing), false);
}
console.log("ok  cron auth: exact Bearer secret only");

const failed =
  'Failed query: update "users" set "phone" = $1, "emergency_contact_name" = $2 where "users"."id" = $3\n' +
  "params: +383 00 000 000,Fake Contact,00000000-0000-0000-0000-000000000000";
const scrubbed = scrubQueryParams(failed);
assert.ok(
  scrubbed.includes('update "users" set "phone" = $1'),
  "keeps the SQL",
);
assert.ok(!scrubbed.includes("+383 00 000 000"), "drops the phone");
assert.ok(!scrubbed.includes("Fake Contact"), "drops the contact name");
assert.ok(scrubbed.endsWith("params: [removed]"));
assert.equal(scrubQueryParams("Something else broke"), "Something else broke");
console.log("ok  query errors lose their bound values, keep the SQL");
