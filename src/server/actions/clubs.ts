"use server";

import { and, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { env } from "@/config/env";
import {
  getOptionalSession,
  requireClubAdmin,
} from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  auditLogs,
  organizationMembers,
  organizations,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { GenericMessage } from "@/lib/email/templates/generic-message";
import { type CreateClubInput,createClubSchema } from "@/lib/validations/club";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** True if no club currently uses this slug. */
export async function checkSlugAvailability(slug: string): Promise<boolean> {
  if (!slug) return false;
  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: { id: true },
  });
  return !existing;
}

export interface CreateClubResult extends ActionResult {
  slug?: string;
}

/**
 * Create a club. Requires an authenticated club_admin. Sets the creator as
 * owner + admin member, writes an audit log, and returns the slug to redirect.
 */
export async function createClub(
  data: CreateClubInput,
): Promise<CreateClubResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const parsed = createClubSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Të dhëna të pavlefshme." };
  }
  const input = parsed.data;

  // Promote to club_admin if they aren't already (e.g. skipped onboarding).
  const me = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { role: true },
  });
  if (me && me.role === "hiker") {
    await db
      .update(users)
      .set({ role: "club_admin" })
      .where(eq(users.id, session.user.id));
  }

  if (!(await checkSlugAvailability(input.slug))) {
    return { success: false, error: "Ky emër është i zënë, provo një tjetër" };
  }

  const [club] = await db
    .insert(organizations)
    .values({
      slug: input.slug,
      name: input.name,
      description: input.description,
      city: input.city,
      foundedYear: input.foundedYear,
      website: input.website || null,
      instagram: input.instagram || null,
      facebook: input.facebook || null,
      ownerId: session.user.id,
    })
    .returning({ id: organizations.id, slug: organizations.slug });

  if (!club) return { success: false, error: "Diçka shkoi keq." };

  await db.insert(organizationMembers).values({
    organizationId: club.id,
    userId: session.user.id,
    role: "admin",
  });

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "club.created",
    entityType: "organization",
    entityId: club.id,
  });

  revalidatePath("/clubs");
  return { success: true, slug: club.slug };
}

/** Join a club as a member. Requires auth; idempotent for active members. */
export async function joinClub(organizationId: string): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) {
    return { success: false, error: "Duhet të jeni i kyçur." };
  }

  const club = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: { slug: true },
  });
  if (!club) {
    return { success: false, error: "Klubi nuk u gjet." };
  }

  const existing = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, organizationId),
      eq(organizationMembers.userId, session.user.id),
    ),
  });

  if (existing && existing.leftAt === null) {
    return { success: false, error: "Jeni tashmë anëtar i këtij klubi." };
  }

  if (existing) {
    // Re-activate a past membership.
    await db
      .update(organizationMembers)
      .set({ leftAt: null, role: "member" })
      .where(eq(organizationMembers.id, existing.id));
  } else {
    await db.insert(organizationMembers).values({
      organizationId,
      userId: session.user.id,
      role: "member",
    });
  }

  revalidatePath(`/clubs/${club.slug}`);
  return { success: true };
}

/** Admin: update editable club fields. */
export async function updateClub(
  slug: string,
  data: {
    name: string;
    description: string;
    city: string;
    foundedYear?: number;
    website?: string;
    instagram?: string;
    facebook?: string;
  },
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const access = await requireClubAdmin(session.user.id, slug);
  if (!access) return { success: false, error: "Nuk keni qasje." };

  await db
    .update(organizations)
    .set({
      name: data.name,
      description: data.description,
      city: data.city,
      foundedYear: data.foundedYear ?? null,
      website: data.website || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
    })
    .where(eq(organizations.id, access.organization.id));

  revalidatePath(`/dashboard/club/${slug}`);
  revalidatePath(`/clubs/${slug}`);
  return { success: true };
}

/** Admin: soft-delete a club (must confirm by typing the exact name). */
export async function deleteClub(
  slug: string,
  confirmName: string,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const access = await requireClubAdmin(session.user.id, slug);
  if (!access) return { success: false, error: "Nuk keni qasje." };
  if (access.role !== "admin") {
    return { success: false, error: "Vetëm administratori mund ta fshijë." };
  }
  if (confirmName.trim() !== access.organization.name) {
    return { success: false, error: "Emri nuk përputhet." };
  }

  await db
    .update(organizations)
    .set({ deletedAt: new Date() })
    .where(eq(organizations.id, access.organization.id));

  revalidatePath("/clubs");
  return { success: true };
}

/** Admin: invite someone by email. Existing users are added immediately; new
 * emails get a link to register and join. */
export async function inviteMember(
  slug: string,
  email: string,
  role: "member" | "organizer",
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const access = await requireClubAdmin(session.user.id, slug);
  if (!access) return { success: false, error: "Nuk keni qasje." };

  // Free tier: cap at 50 active members.
  if (access.organization.subscriptionTier === "free") {
    const [memberCount] = await db
      .select({ value: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, access.organization.id),
          isNull(organizationMembers.leftAt),
        ),
      );
    if ((memberCount?.value ?? 0) >= 50) {
      return {
        success: false,
        error:
          "Keni arritur limitin e 50 anëtarëve. Kaloni te Pro për anëtarë të pakufizuar.",
      };
    }
  }

  const normalized = email.trim().toLowerCase();
  const clubUrl = `${env.NEXT_PUBLIC_APP_URL}/clubs/${slug}`;

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, normalized),
    columns: { id: true },
  });

  if (existingUser) {
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, access.organization.id),
        eq(organizationMembers.userId, existingUser.id),
      ),
    });
    if (membership && membership.leftAt === null) {
      return { success: false, error: "Personi është tashmë anëtar." };
    }
    if (membership) {
      await db
        .update(organizationMembers)
        .set({ leftAt: null, role })
        .where(eq(organizationMembers.id, membership.id));
    } else {
      await db.insert(organizationMembers).values({
        organizationId: access.organization.id,
        userId: existingUser.id,
        role,
      });
    }
    revalidatePath(`/dashboard/club/${slug}`);
  }

  try {
    await sendEmail({
      to: normalized,
      subject: `Ftesë: bashkohu me ${access.organization.name}`,
      template: GenericMessage({
        heading: `Bashkohu me ${access.organization.name}`,
        message: `Je ftuar të bashkohesh me klubin në HikeIt.\n\nHape këtë link: ${clubUrl}`,
      }),
    });
  } catch {
    // Best-effort email.
  }

  return { success: true };
}

/** Admin: change a member's role. */
export async function changeMemberRole(
  slug: string,
  membershipId: string,
  role: "member" | "organizer" | "admin",
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const access = await requireClubAdmin(session.user.id, slug);
  if (!access || access.role !== "admin") {
    return { success: false, error: "Nuk keni qasje." };
  }

  await db
    .update(organizationMembers)
    .set({ role })
    .where(
      and(
        eq(organizationMembers.id, membershipId),
        eq(organizationMembers.organizationId, access.organization.id),
      ),
    );

  revalidatePath(`/dashboard/club/${slug}`);
  return { success: true };
}

/** Admin: remove a member (marks them as left). */
export async function removeMember(
  slug: string,
  membershipId: string,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const access = await requireClubAdmin(session.user.id, slug);
  if (!access || access.role !== "admin") {
    return { success: false, error: "Nuk keni qasje." };
  }

  await db
    .update(organizationMembers)
    .set({ leftAt: new Date() })
    .where(
      and(
        eq(organizationMembers.id, membershipId),
        eq(organizationMembers.organizationId, access.organization.id),
      ),
    );

  revalidatePath(`/dashboard/club/${slug}`);
  return { success: true };
}
