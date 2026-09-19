"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { auditLogs, inviteCodes, organizations } from "@/lib/db/schema";
import { addMonths, resolveEntitlement } from "@/lib/entitlements";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureError } from "@/lib/sentry";
import {
  type CreateInviteCodeInput,
  createInviteCodeSchema,
  type ExtendTrialInput,
  extendTrialSchema,
} from "@/lib/validations/admin";
import { normalizeInviteCode } from "@/server/services/invite-codes";

/**
 * Super-admin trial and invite-code management.
 *
 * Replaces the commission-override panel. HikeIt no longer charges a rate on
 * anything, so the lever a super admin has over a club is how much free Pro
 * runway it gets — a write to `trialEndsAt`, resolved by `resolveEntitlement`
 * like any other trial.
 *
 * Every action re-checks the role server-side via `requireSuperAdmin()` — the
 * route guard protects the page, not the action, and a server action is a
 * public HTTP endpoint. Every mutation is rate-limited and audit-logged.
 */

export interface AdminActionResult {
  success: boolean;
  error?: string;
}

const ADMIN_PATH = "/dashboard/admin";

/**
 * Extend (or set) a club's free trial.
 *
 * Measured in months from *today*, not from the club's existing end date, so
 * "3 months" always means what an admin reading the dialog expects. Extending
 * a club whose trial already lapsed restarts it from now.
 *
 * The reason lives only in `audit_logs` — deliberately no column for it, since
 * nothing in the product reads it and a grant's justification belongs with the
 * record of who made it.
 */
export async function extendClubTrial(
  input: ExtendTrialInput,
): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const parsed = extendTrialSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Të dhëna të pavlefshme." };
  }
  const { organizationId, months, note } = parsed.data;

  const limited = await enforceRateLimit("ratelimit.admin.trial", {
    userId: admin.id,
  });
  if (limited) return { success: false, error: limited };

  try {
    const club = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: { slug: true, subscriptionTier: true, trialEndsAt: true },
    });
    if (!club) return { success: false, error: "Klubi nuk u gjet." };

    const previous = resolveEntitlement(club);
    const now = new Date();
    // Extend from whichever is later: today, or the trial already running.
    // Shortening a club's runway by "extending" it would be a nasty surprise.
    const base =
      club.trialEndsAt && club.trialEndsAt.getTime() > now.getTime()
        ? club.trialEndsAt
        : now;
    const trialEndsAt = addMonths(base, months);

    await db
      .update(organizations)
      .set({
        trialEndsAt,
        // Re-arm the 7-day notice so the club is warned about the *new* end
        // date rather than staying silent because it was warned about the old.
        trialEndingNotifiedAt: null,
      })
      .where(eq(organizations.id, organizationId));

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "admin.trial.extended",
      entityType: "organization",
      entityId: organizationId,
      metadata: {
        previousTier: previous.tier,
        previousSource: previous.source,
        previousTrialEndsAt: club.trialEndsAt?.toISOString() ?? null,
        months,
        trialEndsAt: trialEndsAt.toISOString(),
        note: note?.trim() || null,
      },
    });

    revalidatePath(ADMIN_PATH);
    revalidatePath(`/dashboard/club/${club.slug}`);
    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "extendClubTrial",
      userId: admin.id,
      extra: { organizationId, months },
    });
    return { success: false, error: "Ndryshimi dështoi. Provoni sërish." };
  }
}

/**
 * End a club's trial immediately, returning it to whatever it actually pays
 * for. Used to undo a grant made in error.
 */
export async function endClubTrial(
  organizationId: string,
): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const limited = await enforceRateLimit("ratelimit.admin.trial", {
    userId: admin.id,
  });
  if (limited) return { success: false, error: limited };

  try {
    const club = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: { slug: true, subscriptionTier: true, trialEndsAt: true },
    });
    if (!club) return { success: false, error: "Klubi nuk u gjet." };

    const previous = resolveEntitlement(club);

    // `inviteCodeUsed` is deliberately kept — it's a historical record of how
    // the club signed up, not part of the active grant.
    await db
      .update(organizations)
      .set({ trialEndsAt: null, trialEndingNotifiedAt: null })
      .where(eq(organizations.id, organizationId));

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "admin.trial.ended",
      entityType: "organization",
      entityId: organizationId,
      metadata: {
        previousTier: previous.tier,
        previousSource: previous.source,
        previousTrialEndsAt: club.trialEndsAt?.toISOString() ?? null,
      },
    });

    revalidatePath(ADMIN_PATH);
    revalidatePath(`/dashboard/club/${club.slug}`);
    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "endClubTrial",
      userId: admin.id,
      extra: { organizationId },
    });
    return { success: false, error: "Heqja dështoi. Provoni sërish." };
  }
}

/** Create a new invite code. */
export async function createInviteCode(
  input: CreateInviteCodeInput,
): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const parsed = createInviteCodeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Të dhëna të pavlefshme.",
    };
  }
  const { code, trialMonths, paddleDiscountId, maxUses, expiresAt } =
    parsed.data;

  const limited = await enforceRateLimit("ratelimit.admin.invite_code", {
    userId: admin.id,
  });
  if (limited) return { success: false, error: limited };

  const normalized = normalizeInviteCode(code);

  try {
    const existing = await db.query.inviteCodes.findFirst({
      where: eq(inviteCodes.code, normalized),
      columns: { id: true },
    });
    if (existing) {
      return { success: false, error: "Ky kod ekziston tashmë." };
    }

    const [created] = await db
      .insert(inviteCodes)
      .values({
        code: normalized,
        trialMonths,
        paddleDiscountId: paddleDiscountId?.trim() || null,
        maxUses: maxUses ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: admin.id,
      })
      .returning({ id: inviteCodes.id });

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "admin.invite_code.created",
      entityType: "invite_code",
      entityId: created?.id ?? null,
      metadata: {
        code: normalized,
        trialMonths,
        paddleDiscountId: paddleDiscountId?.trim() || null,
        maxUses: maxUses ?? null,
        expiresAt: expiresAt ?? null,
      },
    });

    revalidatePath(ADMIN_PATH);
    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "createInviteCode",
      userId: admin.id,
      extra: { code: normalized },
    });
    return { success: false, error: "Krijimi dështoi. Provoni sërish." };
  }
}

/** Retire (or re-enable) a code without deleting it. */
export async function toggleInviteCode(
  id: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const limited = await enforceRateLimit("ratelimit.admin.invite_code", {
    userId: admin.id,
  });
  if (limited) return { success: false, error: limited };

  try {
    const [updated] = await db
      .update(inviteCodes)
      .set({ isActive })
      .where(eq(inviteCodes.id, id))
      .returning({ code: inviteCodes.code });

    if (!updated) return { success: false, error: "Kodi nuk u gjet." };

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "admin.invite_code.toggled",
      entityType: "invite_code",
      entityId: id,
      metadata: { code: updated.code, isActive },
    });

    revalidatePath(ADMIN_PATH);
    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "toggleInviteCode",
      userId: admin.id,
      extra: { inviteCodeId: id, isActive },
    });
    return { success: false, error: "Ndryshimi dështoi. Provoni sërish." };
  }
}
