import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * The auth instance can't be imported without a database and secrets, so
 * this reads its source and checks the settings that close two gaps (no test
 * runner in this repo yet):
 *
 *   pnpm exec tsx scripts/check-auth-config.ts
 */
const source = readFileSync("src/lib/auth/index.ts", "utf8");
const installed = readFileSync(
  "node_modules/better-auth/dist/api/routes/password.mjs",
  "utf8",
);

// 1. The unvalidated profile endpoint is off.
assert.match(
  source,
  /disabledPaths:\s*\[[^\]]*"\/update-user"/,
  "/update-user must be in disabledPaths",
);
console.log("ok  /update-user is disabled");

// 1b. Email sign-up can't set an avatar URL either (same hole, other door).
const signUp = source.match(
  /ctx\?\.path === "\/sign-up\/email"\) \{([\s\S]*?)\n {10}\}/,
)?.[1];
assert.ok(signUp, "email sign-up branch not found");
assert.match(signUp, /image:\s*null/, "sign-up must drop the client's image");
console.log("ok  email sign-up drops a client-supplied image");

// 2. Every custom rate-limit rule names an endpoint that exists. A rule for
//    a path Better Auth doesn't serve silently falls back to the baseline.
const rules = source.match(/customRules:\s*\{([\s\S]*?)\n {4}\},/)?.[1] ?? "";
const paths = [...rules.matchAll(/^\s*"(\/[^"]+)":/gm)].map((m) => m[1]);
assert.ok(paths.length > 0, "customRules not found");
assert.ok(
  installed.includes('"/request-password-reset"'),
  "installed Better Auth no longer serves /request-password-reset",
);
assert.ok(
  paths.includes("/request-password-reset"),
  "password-reset emails need their own limit",
);
assert.ok(
  !paths.includes("/forget-password"),
  "/forget-password is not an endpoint of this Better Auth version",
);
assert.ok(paths.includes("/change-password"), "/change-password needs a limit");
console.log(`ok  ${paths.length} rate-limit rules, all on real endpoints`);
