import { and, eq, inArray, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Organization, User } from "@/lib/db/schema";
import { organizationMembers, organizations, users } from "@/lib/db/schema";

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

export type ClubAdminRole = "admin" | "organizer";

/**
 * Verify the user is an active admin/organizer of the club identified by
 * `slug`. Returns the organization + the user's role, or `null` if the user
 * lacks access (callers decide whether to `notFound()`/redirect).
 */
export async function requireClubAdmin(
  userId: string,
  slug: string,
): Promise<{ organization: Organization; role: ClubAdminRole } | null> {
  const rows = await db
    .select({ org: organizations, role: organizationMembers.role })
    .from(organizations)
    .innerJoin(
      organizationMembers,
      and(
        eq(organizationMembers.organizationId, organizations.id),
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.leftAt),
      ),
    )
    .where(eq(organizations.slug, slug))
    .limit(1);

  const row = rows[0];
  if (!row || (row.role !== "admin" && row.role !== "organizer")) return null;
  return { organization: row.org, role: row.role };
}

/**
 * The first club where the user is an active admin/organizer — used to drive
 * club-admin nav and the dashboard home. `null` if they manage none.
 */
export async function getUserAdminClub(
  userId: string,
): Promise<Organization | null> {
  const rows = await db
    .select({ org: organizations })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationMembers.organizationId),
    )
    .where(
      and(
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.leftAt),
        inArray(organizationMembers.role, ["admin", "organizer"]),
      ),
    )
    .limit(1);

  return rows[0]?.org ?? null;
}
