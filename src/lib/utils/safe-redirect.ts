export const DEFAULT_REDIRECT = "/dashboard";

/**
 * Return `value` if it's a same-site relative path, otherwise the fallback.
 * Guards the login page's `?redirect=` param against open redirects: it feeds
 * both `router.push` and Better Auth's social `callbackURL`.
 *
 * Accepted: a path starting with exactly one "/". Rejected:
 * - "//host" — protocol-relative, navigates off-site
 * - any backslash — browsers treat "\" as "/", so "/\host" becomes "//host"
 * - control characters and whitespace — browsers strip tab/newline from URLs,
 *   so "/\t/host" also becomes "//host"
 * - anything with a scheme ("https:", "javascript:") — can't start with "/"
 *
 * Finally the value is resolved against a dummy origin and must stay on it,
 * as a belt-and-braces check on the string rules above.
 */
export function safeRedirect(
  value: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  if (/[\u0000-\u001F\u007F\s]/.test(value)) return fallback;

  try {
    const base = "https://redirect-check.invalid";
    if (new URL(value, base).origin !== base) return fallback;
  } catch {
    return fallback;
  }
  return value;
}

/**
 * A redirect worth carrying through sign-up → email verification → sign-in
 * (e.g. back to `/invite/<token>`): `value` if it's a safe internal path
 * other than "/", else null. Same rules as `safeRedirect`.
 */
export function carriedRedirect(
  value: string | null | undefined,
): string | null {
  const safe = safeRedirect(value, "");
  return safe && safe !== "/" ? safe : null;
}

/**
 * The `callbackURL` Better Auth put into a verification link, when it's a
 * safe internal path to carry. Better Auth defaults it to "/" when the
 * sign-up/sign-in didn't pass one, which yields null here.
 */
export function verificationRedirect(betterAuthUrl: string): string | null {
  try {
    return carriedRedirect(
      new URL(betterAuthUrl).searchParams.get("callbackURL"),
    );
  } catch {
    return null;
  }
}

/** `path` with `?redirect=` appended when there's a redirect to carry. */
export function withRedirect(path: string, redirect: string | null): string {
  return redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path;
}
