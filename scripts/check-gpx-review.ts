import assert from "node:assert/strict";

import { gpxUploadReview } from "../src/lib/trails/gpx-review";

/**
 * Replacing a trail's GPX and its review state (no test runner in this repo
 * yet):
 *
 *   pnpm exec tsx scripts/check-gpx-review.ts
 */
const cases: [
  string,
  Parameters<typeof gpxUploadReview>[0],
  ReturnType<typeof gpxUploadReview>,
][] = [
  [
    "submitter replaces the GPX of a verified trail → back to review",
    { verified: true, bySuperAdmin: false },
    { unverify: true, notifyReviewers: true },
  ],
  [
    "submitter updates a trail still waiting → stays unverified, no new alert",
    { verified: false, bySuperAdmin: false },
    { unverify: true, notifyReviewers: false },
  ],
  [
    "super admin replaces the GPX of a verified trail → stays verified",
    { verified: true, bySuperAdmin: true },
    { unverify: false, notifyReviewers: false },
  ],
  [
    "super admin uploads to a pending trail → not approved by the upload",
    { verified: false, bySuperAdmin: true },
    { unverify: false, notifyReviewers: false },
  ],
];

for (const [name, input, expected] of cases) {
  assert.deepEqual(gpxUploadReview(input), expected, name);
  console.log(`ok  ${name}`);
}
