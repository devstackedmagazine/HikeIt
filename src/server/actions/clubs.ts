"use server";

import { and, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { env } from "@/config/env";
import { getOptionalSession, requireClubAdmin } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  auditLogs,
  organizationMembers,
  organizations,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { GenericMessage } from "@/lib/email/templates/generic-message";
import {
  addMonths,
  resolveEntitlement,
  trialEndsAtFrom,
} from "@/lib/entitlements";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureError } from "@/lib/sentry";
import {
  type CreateClubInput,
  createClubSchema,
  redeemInviteCodeSchema,
} from "@/lib/validations/club";
import {
  inviteCodeErrorMessages,
  type InviteCodeGrant,
  normalizeInviteCode,
  redeemInviteCode,
} from "@/server/services/invite-codes";

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
  /**
   * Set when an invite code was supplied but couldn't be redeemed. The club
   * *was* created (on the standard trial) — this is a warning, not an error.
   */
  inviteWarning?: string;
  /** Set when an invite code was redeemed successfully. */
  inviteApplied?: boolean;
}

/**
 * Create a club. Requires an authenticated club_admin. Sets the creator as
 * owner + admin member, writes an audit log, and returns the slug to redirect.
 *
 * Every new club starts on a 3-month Pro trial. An optional invite code can
 * extend that and attach a Paddle discount for later; an invalid code is
 * reported as a warning and the club falls back to the standard trial.
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

  // Club creation, membership and any invite-code claim commit together: a
  // consumed code must never outlive a club that failed to be created.
  const outcome = await db.transaction(async (tx) => {
    const now = new Date();

    // Redeem first, so the grant can go into the same INSERT. A failure here
    // is collected, never thrown — the club is still created on the trial.
    let grant: InviteCodeGrant | null = null;
    let inviteWarning: string | undefined;
    if (input.inviteCode) {
      const redemption = await redeemInviteCode(input.inviteCode, tx, now);
      if (redemption.ok) {
        grant = redemption.grant;
      } else {
        inviteWarning = inviteCodeErrorMessages[redemption.error];
      }
    }

    const [club] = await tx
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
        // Every club gets the standard 3-month Pro trial. A redeemed code
        // replaces that end date with its own, longer one — codes are only
        // ever worth *more* runway, never less.
        trialEndsAt: grant ? grant.trialEndsAt : trialEndsAtFrom(now),
        ...(grant ? { inviteCodeUsed: grant.code } : {}),
      })
      .returning({ id: organizations.id, slug: organizations.slug });

    if (!club) throw new Error("Club insert returned no row");

    await tx.insert(organizationMembers).values({
      organizationId: club.id,
      userId: session.user.id,
      role: "admin",
    });

    await tx.insert(auditLogs).values({
      userId: session.user.id,
      action: "club.created",
      entityType: "organization",
      entityId: club.id,
      metadata: {
        trialEndsAt: (grant
          ? grant.trialEndsAt
          : trialEndsAtFrom(now)
        ).toISOString(),
        ...(grant
          ? {
              inviteCode: grant.code,
              trialMonths: grant.trialMonths,
              paddleDiscountId: grant.paddleDiscountId,
            }
          : {}),
        ...(inviteWarning ? { inviteCodeRejected: input.inviteCode } : {}),
      },
    });

    return { slug: club.slug, inviteWarning, inviteApplied: grant !== null };
  });

  revalidatePath("/clubs");
  return {
    success: true,
    slug: outcome.slug,
    inviteWarning: outcome.inviteWarning,
    inviteApplied: outcome.inviteApplied,
  };
}

/**
 * Redeem an invite code from an existing club's settings — the same
 * `redeemInviteCode` atomic claim `createClub` uses, so a code's limits
 * (active, unexpired, uses remaining) are enforced identically whether it's
 * claimed at creation or later.
 *
 * Unlike creation, an existing club has a trial that may already be running,
 * so the grant extends from wherever that trial currently ends (or from now,
 * if it's already lapsed or never started) — never from today outright. A
 * club with 2 months left redeeming a 6-month code gets 8, not 6. This is the
 * same base-selection rule `extendClubTrial` uses for admin-granted months.
 */
export async function redeemInviteCodeForClub(
  slug: string,
  rawCode: string,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const access = await requireClubAdmin(session.user.id, slug);
  if (!access || access.role !== "admin") {
    return { success: false, error: "Nuk keni qasje." };
  }

  const parsed = redeemInviteCodeSchema.safeParse({ code: rawCode });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Kod i pavlefshëm.",
    };
  }

  const limited = await enforceRateLimit("ratelimit.club.invite_code", {
    userId: session.user.id,
  });
  if (limited) return { success: false, error: limited };

  const normalized = normalizeInviteCode(parsed.data.code);
  const organizationId = access.organization.id;

  try {
    const outcome = await db.transaction(async (tx) => {
      const now = new Date();

      // Re-read fresh inside the transaction rather than trusting the
      // pre-transaction `access.organization` — the "already redeemed" check
      // and the extension base both need the current row, not a stale one.
      const current = await tx.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
        columns: { trialEndsAt: true, inviteCodeUsed: true },
      });
      if (!current) {
        return { ok: false as const, error: "Klubi nuk u gjet." };
      }
      if (current.inviteCodeUsed === normalized) {
        return {
          ok: false as const,
          error: "Ky kod është përdorur tashmë nga klubi juaj.",
        };
      }

      const redemption = await redeemInviteCode(normalized, tx, now);
      if (!redemption.ok) {
        return {
          ok: false as const,
          error: inviteCodeErrorMessages[redemption.error],
        };
      }

      // From the trial's current end if it's still running, else from today —
      // codes only ever add runway, never reset it.
      const base =
        current.trialEndsAt && current.trialEndsAt.getTime() > now.getTime()
          ? current.trialEndsAt
          : now;
      const trialEndsAt = addMonths(base, redemption.grant.trialMonths);

      await tx
        .update(organizations)
        .set({ trialEndsAt, inviteCodeUsed: redemption.grant.code })
        .where(eq(organizations.id, organizationId));

      await tx.insert(auditLogs).values({
        userId: session.user.id,
        action: "club.invite_code.redeemed",
        entityType: "organization",
        entityId: organizationId,
        metadata: {
          code: redemption.grant.code,
          trialMonths: redemption.grant.trialMonths,
          previousTrialEndsAt: current.trialEndsAt?.toISOString() ?? null,
          trialEndsAt: trialEndsAt.toISOString(),
          paddleDiscountId: redemption.grant.paddleDiscountId,
        },
      });

      return { ok: true as const };
    });

    if (!outcome.ok) return { success: false, error: outcome.error };

    revalidatePath(`/dashboard/club/${slug}`);
    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "redeemInviteCodeForClub",
      userId: session.user.id,
      extra: { organizationId, code: normalized },
    });
    return { success: false, error: "Diçka shkoi keq. Provoni sërish." };
  }
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

  // Free tier: cap at 50 active members. Resolved, not read straight off the
  // row — a club inside its trial is entitled to Pro and must not be capped.
  if (resolveEntitlement(access.organization).tier === "free") {
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
const LAST_ADMIN_ERROR =
  "Nuk mund të ndryshosh rolin tënd — je administratori i vetëm i klubit. Cakto një admin tjetër fillimisht.";

/** True if this organization currently has one active admin or fewer. */
async function isOnlyAdmin(organizationId: string): Promise<boolean> {
  const [row] = await db
    .select({ value: count() })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.role, "admin"),
        isNull(organizationMembers.leftAt),
      ),
    );
  return (row?.value ?? 0) <= 1;
}

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

  const target = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.id, membershipId),
      eq(organizationMembers.organizationId, access.organization.id),
    ),
  });
  if (!target) return { success: false, error: "Anëtari nuk u gjet." };

  // Prevent an admin demoting themselves when they're the only admin left —
  // that would lock the club out of management entirely.
  if (
    target.userId === session.user.id &&
    target.role === "admin" &&
    role !== "admin" &&
    (await isOnlyAdmin(access.organization.id))
  ) {
    return { success: false, error: LAST_ADMIN_ERROR };
  }

  await db
    .update(organizationMembers)
    .set({ role })
    .where(eq(organizationMembers.id, membershipId));

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

  const target = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.id, membershipId),
      eq(organizationMembers.organizationId, access.organization.id),
    ),
  });
  if (!target) return { success: false, error: "Anëtari nuk u gjet." };

  // Same guard as changeMemberRole — the only admin can't remove themselves.
  if (
    target.userId === session.user.id &&
    target.role === "admin" &&
    (await isOnlyAdmin(access.organization.id))
  ) {
    return { success: false, error: LAST_ADMIN_ERROR };
  }

  await db
    .update(organizationMembers)
    .set({ leftAt: new Date() })
    .where(eq(organizationMembers.id, membershipId));

  revalidatePath(`/dashboard/club/${slug}`);
  return { success: true };
}

/** Admin: set club logo / cover Cloudinary public ids. */
export async function setClubImages(
  slug: string,
  images: { logoUrl?: string | null; coverUrl?: string | null },
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const access = await requireClubAdmin(session.user.id, slug);
  if (!access) return { success: false, error: "Nuk keni qasje." };

  await db
    .update(organizations)
    .set({
      ...(images.logoUrl !== undefined ? { logoUrl: images.logoUrl } : {}),
      ...(images.coverUrl !== undefined ? { coverUrl: images.coverUrl } : {}),
    })
    .where(eq(organizations.id, access.organization.id));

  revalidatePath(`/dashboard/club/${slug}`);
  revalidatePath(`/clubs/${slug}`);
  return { success: true };
}
