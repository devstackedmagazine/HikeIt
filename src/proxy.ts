import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

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

  // Already authenticated → keep them out of login/register.
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/register"],
};
