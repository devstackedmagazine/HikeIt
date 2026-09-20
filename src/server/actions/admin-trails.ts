"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { auditLogs, trails } from "@/lib/db/schema";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureError } from "@/lib/sentry";
import { createNotification } from "@/server/queries/notifications";

/**
 * Super-admin trail review: approve or reject a user-submitted trail.
 *
 * Every submitted trail lands with `verified: false`, and every public query
 * filters on `verified = true` — so until one of these two actions runs, a
 * submission is invisible to everyone but its submitter and a super admin
 * (see the `canUploadGpx` gate on the trail detail page). Both actions
 * re-check the role server-side, since the route guard on `/dashboard/admin`
 * protects the page, not these action endpoints.
 */

export interface AdminActionResult {
  success: boolean;
  error?: string;
}

const ADMIN_PATH = "/dashboard/admin";

/** Publish a submitted trail and notify whoever submitted it. */
export async function approveTrail(
  trailId: string,
): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const limited = await enforceRateLimit("ratelimit.admin.trail_review", {
    userId: admin.id,
  });
  if (limited) return { success: false, error: limited };

  try {
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
      columns: {
        id: true,
        slug: true,
        name: true,
        verified: true,
        submittedBy: true,
      },
    });
    if (!trail) return { success: false, error: "Shtegu nuk u gjet." };
    if (trail.verified) {
      return { success: false, error: "Shtegu është tashmë i verifikuar." };
    }

    await db
      .update(trails)
      .set({ verified: true })
      .where(eq(trails.id, trailId));

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "trail.approved",
      entityType: "trail",
      entityId: trailId,
      metadata: { name: trail.name, slug: trail.slug },
    });

    // Best-effort — approval itself has already committed, and a notification
    // failure must not make the approval look like it didn't happen.
    if (trail.submittedBy) {
      try {
        await createNotification({
          userId: trail.submittedBy,
          type: "trail",
          title: "Shtegu juaj u aprovua",
          body: `${trail.name} është tani i dukshëm publikisht në HikeIt.`,
          link: `/trails/${trail.slug}`,
        });
      } catch {
        // Ignore.
      }
    }

    revalidatePath(ADMIN_PATH);
    revalidatePath("/trails");
    revalidatePath(`/trails/${trail.slug}`);
    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "approveTrail",
      userId: admin.id,
      extra: { trailId },
    });
    return { success: false, error: "Aprovimi dështoi. Provoni sërish." };
  }
}

/**
 * Reject a submitted trail.
 *
 * Deliberately not a delete, soft or hard: the trail row and any GPX it
 * carries are left exactly as submitted — only an audit-log entry records the
 * decision. That entry is also what `getUnverifiedTrails` checks to keep a
 * rejected trail from reappearing in the queue, so no schema change was
 * needed: `verified` already has no way to tell "not yet reviewed" apart from
 * "reviewed and rejected", and `audit_logs` is where this codebase already
 * keeps that kind of decision history (see `extendClubTrial`'s note field —
 * same reasoning). Nothing here is destructive or hard to reverse; there's
 * just no "un-reject" action yet because nothing asked for one.
 */
export async function rejectTrail(
  trailId: string,
  reason?: string,
): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const limited = await enforceRateLimit("ratelimit.admin.trail_review", {
    userId: admin.id,
  });
  if (limited) return { success: false, error: limited };

  try {
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
      columns: { id: true, slug: true, name: true, verified: true },
    });
    if (!trail) return { success: false, error: "Shtegu nuk u gjet." };
    if (trail.verified) {
      return {
        success: false,
        error: "Shtegu është tashmë i verifikuar — nuk mund të refuzohet.",
      };
    }

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "trail.rejected",
      entityType: "trail",
      entityId: trailId,
      metadata: {
        name: trail.name,
        slug: trail.slug,
        reason: reason?.trim() || null,
      },
    });

    revalidatePath(ADMIN_PATH);
    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "rejectTrail",
      userId: admin.id,
      extra: { trailId },
    });
    return { success: false, error: "Refuzimi dështoi. Provoni sërish." };
  }
}
