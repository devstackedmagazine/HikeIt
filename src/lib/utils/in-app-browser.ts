/**
 * In-app browsers (the webviews Instagram, Facebook, TikTok and LinkedIn open
 * links in) can't complete Google sign-in: Google refuses OAuth in embedded
 * webviews, and the request often fails outright with "Failed to fetch".
 */
const IN_APP_BROWSER_UA = [
  /Instagram/i,
  /FBAN|FBAV|FB_IAB|FBIOS/i, // Facebook and Messenger
  /musical_ly|BytedanceWebview|TikTok/i,
  /LinkedInApp/i,
];

export function isInAppBrowser(userAgent: string): boolean {
  return IN_APP_BROWSER_UA.some((pattern) => pattern.test(userAgent));
}
