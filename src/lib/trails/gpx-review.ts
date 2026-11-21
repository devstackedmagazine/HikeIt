/**
 * What a new GPX file does to a trail's review state. Only a file a super
 * admin has seen is public: when the submitter replaces the GPX the trail is
 * unverified again (off the public listing until approved), and a verified
 * trail going back is announced to the reviewers. A super admin's own upload
 * changes nothing.
 */
export function gpxUploadReview(input: {
  verified: boolean;
  bySuperAdmin: boolean;
}): { unverify: boolean; notifyReviewers: boolean } {
  return {
    unverify: !input.bySuperAdmin,
    notifyReviewers: input.verified && !input.bySuperAdmin,
  };
}
