"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/helpers";
import { resolveCommission } from "@/lib/commission";
import { db } from "@/lib/db";
import { auditLogs, inviteCodes, organizations } from "@/lib/db/schema";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureError } from "@/lib/sentry";
import {
  type CreateInviteCodeInput,
  createInviteCodeSchema,
  percentToRate,
  type SetCommissionInput,
  setCommissionSchema,
} from "@/lib/validations/admin";
import { normalizeInviteCode } from "@/server/services/invite-codes";

/**
 * Super-admin commission and invite-code management.
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

/** Set (or replace) a club's commission override. */
export async function setClubCommission(
  input: SetCommissionInput,
): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const parsed = setCommissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Të dhëna të pavlefshme." };
  }
  const { organizationId, ratePercent, until, note } = parsed.data;

  const limited = await enforceRateLimit("ratelimit.admin.commission", {
    userId: admin.id,
  });
  if (limited) return { success: false, error: limited };

  try {
    const club = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: {
        slug: true,
        commissionRate: true,
        commissionOverrideUntil: true,
        commissionOverrideReason: true,
        trialEndsAt: true,
      },
    });
    if (!club) return { success: false, error: "Klubi nuk u gjet." };

    const previous = resolveCommission(club);
    const rate = percentToRate(ratePercent);
    const untilDate = until ? new Date(until) : null;

    await db
      .update(organizations)
      .set({
        commissionRate: rate.toFixed(4),
        commissionOverrideUntil: untilDate,
        commissionOverrideReason: "super_admin",
        commissionOverrideNote: note?.trim() ? note.trim() : null,
      })
      .where(eq(organizations.id, organizationId));

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "admin.commission.updated",
      entityType: "organization",
      entityId: organizationId,
      metadata: {
        oldRate: previous.rate,
        oldSource: previous.source,
        newRate: rate,
        until: untilDate?.toISOString() ?? null,
        note: note?.trim() || null,
      },
    });

    revalidatePath(ADMIN_PATH);
    revalidatePath(`/dashboard/club/${club.slug}`);
    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "setClubCommission",
      userId: admin.id,
      extra: { organizationId, ratePercent },
    });
    return { success: false, error: "Ndryshimi dështoi. Provoni sërish." };
  }
}

/**
 * Clear a club's override, returning it to normal resolution (trial if still
 * running, otherwise the 2.5% default).
 */
export async function clearClubCommission(
  organizationId: string,
): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const limited = await enforceRateLimit("ratelimit.admin.commission", {
    userId: admin.id,
  });
  if (limited) return { success: false, error: limited };

  try {
    const club = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: {
        slug: true,
        commissionRate: true,
        commissionOverrideUntil: true,
        commissionOverrideReason: true,
        trialEndsAt: true,
      },
    });
    if (!club) return { success: false, error: "Klubi nuk u gjet." };

    const previous = resolveCommission(club);

    // `inviteCodeUsed` is deliberately kept — it's a historical record of how
    // the club signed up, not part of the active override.
    await db
      .update(organizations)
      .set({
        commissionRate: null,
        commissionOverrideUntil: null,
        commissionOverrideReason: null,
        commissionOverrideNote: null,
      })
      .where(eq(organizations.id, organizationId));

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "admin.commission.updated",
      entityType: "organization",
      entityId: organizationId,
      metadata: {
        oldRate: previous.rate,
        oldSource: previous.source,
        // Null new rate = the override was removed, not set to zero.
        newRate: null,
        cleared: true,
      },
    });

    revalidatePath(ADMIN_PATH);
    revalidatePath(`/dashboard/club/${club.slug}`);
    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "clearClubCommission",
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
  const { code, ratePercent, durationMonths, maxUses, expiresAt } = parsed.data;

  const limited = await enforceRateLimit("ratelimit.admin.invite_code", {
    userId: admin.id,
  });
  if (limited) return { success: false, error: limited };

  const normalized = normalizeInviteCode(code);
  const rate = percentToRate(ratePercent);

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
        commissionRate: rate.toFixed(4),
        durationMonths: durationMonths ?? null,
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
        rate,
        durationMonths: durationMonths ?? null,
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
