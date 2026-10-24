import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

import { carriedRedirect } from "@/lib/utils/safe-redirect";

/**
 * Route protection via an optimistic session-cookie check. The proxy runs on
 * the edge, so we only look at cookie presence here (no DB round-trip); real
 * session validation happens in Server Components/Actions via
 * `getRequiredSession()`.
 *
 * The `matcher` below limits this proxy to dashboard/onboarding and the auth
 * pages, so `/api/auth/*` and all public routes (`/`, `/trails`, … ) are never
 * touched.
 */
/**
 * `/dashboard/admin` is covered by the `/dashboard` prefix, so an
 * unauthenticated request is bounced here. The *role* check (super_admin) is
 * deliberately not done at the edge: reading `users.role` needs a DB round-trip
 * that this proxy exists to avoid. `/dashboard/admin` calls
 * `requireSuperAdmin()`, which `notFound()`s — and each admin server action
 * re-checks the role independently.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];
const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!getSessionCookie(request);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Unauthenticated → bounce to /login, remembering where they were headed.
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated → keep them out of login/register, and send them
  // where they were headed (e.g. an invite) if that's a safe internal path.
  if (isAuthPage && isLoggedIn) {
    const next =
      carriedRedirect(request.nextUrl.searchParams.get("redirect")) ??
      "/dashboard";
    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/register"],
};
