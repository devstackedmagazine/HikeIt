import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { inspect } from "node:util";

import {
  installLogSanitiser,
  sanitizeForLog,
  sanitizeText,
  scrubEvent,
} from "../src/lib/sentry/scrub";

/**
 * What may leave the server in a log line or a Sentry event (no test runner
 * in this repo yet). Fake values only:
 *
 *   pnpm exec tsx scripts/check-log-sanitising.ts
 */
const PHONE = "+383 00 000 000";
const LOCAL_PHONE = "044 000 000";
const EMAIL = "fake.hiker@example.test";
const NAME = "Fake Contact";
const ID = "3f2b8c1e-9d4a-4e6f-8a1b-446655440000";
const secrets = [PHONE, LOCAL_PHONE, EMAIL, NAME];
const leaks = (value: unknown) =>
  secrets.filter((s) => inspect(value, { depth: 10 }).includes(s));

// 1. Free text.
const failedQuery =
  'Failed query: update "users" set "phone" = $1, "emergency_contact_name" = $2 where "users"."id" = $3\n' +
  `params: ${PHONE},${NAME},${ID}`;
const text = sanitizeText(failedQuery);
assert.ok(text.includes('update "users" set "phone" = $1'), "keeps the SQL");
assert.deepEqual(leaks(text), []);
assert.equal(
  sanitizeText(`Mail to ${EMAIL} bounced, call ${PHONE} or ${LOCAL_PHONE}`),
  "Mail to [email] bounced, call [phone] or [phone]",
);
// Ids, dates, coordinates and counts are not phone numbers.
for (const kept of [
  `trail ${ID} not found`,
  "starts 2026-11-15T08:00:00.000Z",
  "at 42.6629138, 21.1655028",
  "took 1234567 ms, 15 rows",
]) {
  assert.equal(sanitizeText(kept), kept);
}
console.log("ok  text: bound values, emails and phone numbers removed");

// 2. Structured context: personal keys lose their value, the rest stays.
const extra = sanitizeForLog({
  tripId: ID,
  phase: "insert",
  phone: PHONE,
  emergencyContactName: NAME,
  emergency_contact_phone: LOCAL_PHONE,
  email: EMAIL,
  name: NAME,
  submittedByName: NAME,
  nested: [{ to: EMAIL, note: `wrote to ${EMAIL}` }],
}) as Record<string, unknown>;
assert.equal(extra.tripId, ID);
assert.equal(extra.phase, "insert");
assert.deepEqual(leaks(extra), []);
console.log("ok  context: personal fields removed, ids kept");

// 3. Errors: a driver error carries the values in its message, in extra
//    fields and in its cause.
const cause = Object.assign(new Error("duplicate key value"), {
  code: "23505",
  detail: `Key (email)=(${EMAIL}) already exists.`,
});
const queryError = Object.assign(new Error(failedQuery, { cause }), {
  params: [PHONE, NAME, ID],
});
const cleanError = sanitizeForLog(queryError) as Error & { cause: Error };
assert.ok(cleanError instanceof Error);
assert.ok(cleanError.message.endsWith("params: [removed]"));
assert.ok(cleanError.stack?.includes("\n    at "), "keeps the stack frames");
assert.equal((cleanError.cause as Error & { code: string }).code, "23505");
assert.deepEqual(leaks(cleanError), []);
console.log("ok  errors: clean message, frames and code kept, no driver data");

// 4. Sentry safety net.
const event = {
  message: `could not email ${EMAIL}`,
  exception: { values: [{ value: failedQuery }] },
  extra: { phone: PHONE, tripId: ID },
  breadcrumbs: [{ message: `called ${LOCAL_PHONE}`, data: { email: EMAIL } }],
  request: {
    cookies: { session: "fake-session" },
    data: { phone: PHONE, emergencyContactName: NAME },
    query_string: `email=${EMAIL}`,
    headers: { cookie: "fake-session", authorization: "Bearer fake-secret" },
  },
  user: { id: ID, email: EMAIL, username: NAME },
};
scrubEvent(event);
assert.deepEqual(leaks(event), []);
assert.ok(!inspect(event, { depth: 10 }).includes("fake-se"), "no credentials");
assert.deepEqual(event.user, { id: ID });
assert.equal(event.extra.tripId, ID);
console.log("ok  Sentry event: nothing personal, no body, cookies or secret");

// 5. Server console: what Next.js logs for an uncaught failed query.
const written: unknown[][] = [];
const fakeConsole = {
  error: (...args: unknown[]) => void written.push(args),
  warn: (...args: unknown[]) => void written.push(args),
};
installLogSanitiser(fakeConsole);
fakeConsole.error("[action] failed", queryError);
fakeConsole.warn(`retrying for ${EMAIL}`, { phone: PHONE });
assert.equal(written.length, 2);
assert.deepEqual(leaks(written), []);
assert.ok(
  inspect(written).includes("Failed query"),
  "the error is still logged",
);
console.log("ok  console.error / console.warn are sanitised");

// 6. Every action and route reports through the helper: no direct Sentry
//    capture, and no console call without the sanitiser.
const offenders = ["src/server/actions", "src/app/api"].flatMap((dir) =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => /\.tsx?$/.test(f))
    .flatMap((f) =>
      readFileSync(`${dir}/${f}`, "utf8")
        .split("\n")
        .filter(
          (line) =>
            /Sentry\.capture(Exception|Message)\(/.test(line) ||
            (/console\.\w+\(/.test(line) && !line.includes("sanitizeForLog(")),
        )
        .map((line) => `${dir}/${f}: ${line.trim()}`),
    ),
);
assert.deepEqual(offenders, []);
console.log("ok  actions and routes log and report only through the helper");
