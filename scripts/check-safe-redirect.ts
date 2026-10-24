import assert from "node:assert/strict";

import {
  carriedRedirect,
  safeRedirect,
  verificationRedirect,
  withRedirect,
} from "../src/lib/utils/safe-redirect";

/**
 * The redirect that carries an invite through sign-up → verify → sign-in must
 * never leave the site (no test runner in this repo yet):
 *
 *   pnpm exec tsx scripts/check-safe-redirect.ts
 */
const invite = "/invite/abc123_-XYZ";

// Internal paths pass.
assert.equal(carriedRedirect(invite), invite);
assert.equal(
  carriedRedirect("/trips/some-trip?tab=x#top"),
  "/trips/some-trip?tab=x#top",
);
assert.equal(safeRedirect(invite), invite);

// Nothing worth carrying.
for (const v of [null, undefined, "", "/"]) {
  assert.equal(carriedRedirect(v), null, String(v));
}

// Open-redirect shapes are all rejected.
const attacks = [
  "https://evil.example",
  "http://evil.example/invite/abc",
  "//evil.example",
  "///evil.example",
  "/\\evil.example",
  "\\\\evil.example",
  "/\t/evil.example",
  "/\n/evil.example",
  " /invite/abc",
  "javascript:alert(1)",
  "data:text/html,hi",
  "invite/abc",
  "evil.example",
];
for (const v of attacks) {
  assert.equal(carriedRedirect(v), null, JSON.stringify(v));
  assert.equal(safeRedirect(v), "/dashboard", JSON.stringify(v));
}
console.log(`ok  ${attacks.length} open-redirect shapes rejected`);

// The callbackURL Better Auth puts in its verification URL.
const ba = (cb?: string) =>
  `https://hikeit.example/api/auth/verify-email?token=t.k.n` +
  (cb === undefined ? "" : `&callbackURL=${encodeURIComponent(cb)}`);
assert.equal(verificationRedirect(ba(invite)), invite);
assert.equal(verificationRedirect(ba("/")), null); // Better Auth's default
assert.equal(verificationRedirect(ba()), null);
for (const v of attacks) {
  assert.equal(verificationRedirect(ba(v)), null, JSON.stringify(v));
}
assert.equal(verificationRedirect("not a url"), null);
console.log("ok  verification link carries only safe internal paths");

// Building links.
assert.equal(withRedirect("/register", null), "/register");
assert.equal(
  withRedirect("/register", invite),
  "/register?redirect=%2Finvite%2Fabc123_-XYZ",
);
assert.equal(
  new URL(withRedirect("/login", invite), "https://x.example").searchParams.get(
    "redirect",
  ),
  invite,
);
console.log("ok  redirect survives a round trip through the query string");
