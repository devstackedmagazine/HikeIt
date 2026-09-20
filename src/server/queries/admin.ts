import { and, count, desc, eq, isNull, notExists } from "drizzle-orm";

import { db } from "@/lib/db";
import type { InviteCode, Trail } from "@/lib/db/schema";
import {
  auditLogs,
  inviteCodes,
  organizationMembers,
  organizations,
  trails,
  users,
} from "@/lib/db/schema";
import {
  type EntitlementSource,
  type EntitlementTier,
  resolveEntitlement,
} from "@/lib/entitlements";

/**
 * Read models for the super-admin panel. Access control lives at the route
 * (`requireSuperAdmin`) — these functions assume the caller is authorized.
 */

export interface AdminClubRow {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  memberCount: number;
  /** Resolved through `resolveEntitlement` — never read off the row directly. */
  tier: EntitlementTier;
  source: EntitlementSource;
  endsAt: Date | null;
  /** Raw state, so the trial-extension dialog can pre-fill accurately. */
  subscriptionTier: EntitlementTier;
  inviteCodeUsed: string | null;
  trialEndsAt: Date | null;
}

/** Every live club with its member count and resolved entitlement state. */
export async function getAdminClubs(): Promise<AdminClubRow[]> {
  const now = new Date();

  const rows = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      name: organizations.name,
      city: organizations.city,
      subscriptionTier: organizations.subscriptionTier,
      inviteCodeUsed: organizations.inviteCodeUsed,
      trialEndsAt: organizations.trialEndsAt,
      // Correlated count keeps this a single query rather than N+1 across
      // every club in the table.
      memberCount: db.$count(
        organizationMembers,
        and(
          eq(organizationMembers.organizationId, organizations.id),
          isNull(organizationMembers.leftAt),
        ),
      ),
    })
    .from(organizations)
    .where(isNull(organizations.deletedAt))
    .orderBy(desc(organizations.createdAt));

  return rows.map((row) => {
    const entitlement = resolveEntitlement(row, now);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      city: row.city,
      memberCount: Number(row.memberCount),
      tier: entitlement.tier,
      source: entitlement.source,
      endsAt: entitlement.endsAt,
      subscriptionTier: row.subscriptionTier,
      inviteCodeUsed: row.inviteCodeUsed,
      trialEndsAt: row.trialEndsAt,
    };
  });
}

/**
 * Whether a code can still be redeemed, and if not, why. Derived on the server
 * so the table doesn't have to call `Date.now()` during render.
 */
export type InviteCodeStatus = "active" | "inactive" | "expired" | "exhausted";

export interface InviteCodeRow extends InviteCode {
  status: InviteCodeStatus;
}

/** All invite codes, newest first, with their redeemability resolved. */
export async function getInviteCodes(): Promise<InviteCodeRow[]> {
  const now = new Date();
  const rows = await db
    .select()
    .from(inviteCodes)
    .orderBy(desc(inviteCodes.createdAt))
    .limit(200);

  return rows.map((code) => ({
    ...code,
    status: !code.isActive
      ? "inactive"
      : code.expiresAt !== null && code.expiresAt.getTime() <= now.getTime()
        ? "expired"
        : code.maxUses !== null && code.usedCount >= code.maxUses
          ? "exhausted"
          : "active",
  }));
}

/** How many clubs are currently on each entitlement source. */
export async function getEntitlementSummary(): Promise<{
  totalClubs: number;
  onTrial: number;
  onSubscription: number;
  onFree: number;
}> {
  const clubs = await getAdminClubs();
  return {
    totalClubs: clubs.length,
    onTrial: clubs.filter((c) => c.source === "trial").length,
    onSubscription: clubs.filter((c) => c.source === "subscription").length,
    onFree: clubs.filter((c) => c.source === "free").length,
  };
}

/** Total redemptions across all codes — small helper for the codes tab header. */
export async function getInviteCodeUsageTotal(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(inviteCodes);
  return row?.value ?? 0;
}

export interface UnverifiedTrailRow {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  difficulty: Trail["difficulty"];
  distanceKm: string | null;
  elevationGainM: number | null;
  hasGpx: boolean;
  submittedByName: string | null;
  submittedByEmail: string | null;
  createdAt: Date;
}

/**
 * Submitted trails still awaiting review, newest first.
 *
 * `verified` alone can't distinguish "not yet reviewed" from "reviewed and
 * rejected" — there's no separate column for that, deliberately: rejection
 * doesn't touch the trail row at all (see `rejectTrail`), it only writes an
 * audit-log entry, so nothing about a rejected trail's data or its uploaded
 * GPX is ever destroyed. This query excludes a trail the moment that entry
 * exists, which is the only place "rejected" is recorded.
 */
export async function getUnverifiedTrails(): Promise<UnverifiedTrailRow[]> {
  const rows = await db
    .select({
      id: trails.id,
      slug: trails.slug,
      name: trails.name,
      region: trails.region,
      difficulty: trails.difficulty,
      distanceKm: trails.distanceKm,
      elevationGainM: trails.elevationGainM,
      gpxUrl: trails.gpxUrl,
      createdAt: trails.createdAt,
      submittedByName: users.name,
      submittedByEmail: users.email,
    })
    .from(trails)
    .leftJoin(users, eq(users.id, trails.submittedBy))
    .where(
      and(
        eq(trails.verified, false),
        notExists(
          db
            .select({ id: auditLogs.id })
            .from(auditLogs)
            .where(
              and(
                eq(auditLogs.entityType, "trail"),
                eq(auditLogs.action, "trail.rejected"),
                eq(auditLogs.entityId, trails.id),
              ),
            ),
        ),
      ),
    )
    .orderBy(desc(trails.createdAt));

  return rows.map(({ gpxUrl, ...row }) => ({
    ...row,
    hasGpx: gpxUrl !== null,
  }));
}
