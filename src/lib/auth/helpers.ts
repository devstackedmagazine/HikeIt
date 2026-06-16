import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { User } from "@/lib/db/schema";
import { users } from "@/lib/db/schema";

/** Better Auth's combined `{ session, user }` payload. */
export type AuthSession = typeof auth.$Infer.Session;

/**
 * Current session in a Server Component / Server Action, or `null` if the
 * request is unauthenticated.
 */
export async function getOptionalSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Current session, redirecting to `/login` when unauthenticated. The
 * `redirect()` throws internally, so callers can treat the return as
 * always-present.
 */
export async function getRequiredSession(): Promise<AuthSession> {
  const session = await getOptionalSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Current user with their full profile row from our `users` table (includes
 * `role`, `bio`, `avatarUrl`, soft-delete state). Redirects to `/login` when
 * unauthenticated.
 */
export async function getRequiredUser(): Promise<User> {
  const session = await getRequiredSession();
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!user) redirect("/login");
  return user;
}
