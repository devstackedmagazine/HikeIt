import "server-only";

import crypto from "node:crypto";

import { and, count, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  auditLogs,
  clubInvitations,
  organizationMembers,
  organizations,
  users,
} from "@/lib/db/schema";
import { resolveEntitlement } from "@/lib/entitlements";

/** How long an emailed invite link stays valid. Re-inviting restarts it. */
export const INVITATION_TTL_DAYS = 7;

/** Members a free-tier club may have; mirrors the cap in `inviteMember`. */
const FREE_TIER_MEMBER_LIMIT = 50;

/**
 * A fresh link token and the hash that gets stored. 32 random bytes, so the
 * token can't be guessed; only the SHA-256 hex digest ever reaches the
 * database (the table's check constraint enforces that shape).
 */
export function createInvitationToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export function hashInvitationToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

/** Cheap shape check before hashing: base64url of 32 bytes is 43 chars. */
function isWellFormedToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

/**
 * "a****@example.com" — enough for the invitee to recognise which address the
 * invite went to without printing it in full on a page anyone with the link
 * can open.
 */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(3, local.length - 1))}@${domain}`;
}

export type InvitationProblem =
  | "invalid"
  | "expired"
  | "used"
  | "declined"
  | "club_gone"
  | "wrong_email"
  | "unverified_email"
  | "member_limit";

/** Albanian (formal) message for each way an invitation can't be used. */
export const invitationProblemMessages: Record<InvitationProblem, string> = {
  invalid:
    "Kjo ftesë nuk është e vlefshme. Kontrolloni linkun ose kërkoni nga klubi një ftesë të re.",
  expired:
    "Kjo ftesë ka skaduar. Kërkoni nga administratori i klubit t'ju dërgojë një ftesë të re.",
  used: "Kjo ftesë është përdorur tashmë.",
  declined:
    "Ju e keni refuzuar këtë ftesë. Nëse ndërruat mendje, kërkoni nga klubi një ftesë të re.",
  club_gone: "Ky klub nuk është më aktiv në HikeIt.",
  wrong_email:
    "Kjo ftesë është dërguar në një adresë tjetër email. Dilni nga llogaria dhe hyni me adresën ku e morët ftesën.",
  unverified_email:
    "Konfirmoni fillimisht adresën tuaj email, pastaj hapni sërish linkun e ftesës.",
  member_limit:
    "Klubi ka arritur limitin e anëtarëve. Ju lutemi kontaktoni administratorin e klubit.",
};

export interface InvitationPreview {
  clubName: string;
  clubSlug: string;
  role: "member" | "organizer";
  maskedEmail: string;
  expiresAt: Date;
}

/**
 * Read-only lookup for the /invite/[token] page. Returns the invitation's
 * display details, or the reason it can't be used. Doesn't check who is
 * logged in — `acceptInvitation` does that.
 */
export async function getInvitationPreview(
  token: string,
): Promise<
  | { ok: true; invitation: InvitationPreview; email: string }
  | { ok: false; problem: InvitationProblem }
> {
  if (!isWellFormedToken(token)) return { ok: false, problem: "invalid" };

  const row = await db.query.clubInvitations.findFirst({
    where: eq(clubInvitations.tokenHash, hashInvitationToken(token)),
    with: {
      organization: { columns: { name: true, slug: true, deletedAt: true } },
    },
  });
  if (!row) return { ok: false, problem: "invalid" };

  const problem = statusProblem(row, row.organization.deletedAt);
  if (problem) return { ok: false, problem };

  return {
    ok: true,
    email: row.email,
    invitation: {
      clubName: row.organization.name,
      clubSlug: row.organization.slug,
      role: row.role === "organizer" ? "organizer" : "member",
      maskedEmail: maskEmail(row.email),
      expiresAt: row.expiresAt,
    },
  };
}

function statusProblem(
  row: { acceptedAt: Date | null; declinedAt: Date | null; expiresAt: Date },
  clubDeletedAt: Date | null,
): InvitationProblem | null {
  if (row.acceptedAt) return "used";
  if (row.declinedAt) return "declined";
  if (clubDeletedAt) return "club_gone";
  if (row.expiresAt.getTime() <= Date.now()) return "expired";
  return null;
}

export type AcceptOutcome =
  | { ok: true; clubSlug: string; alreadyMember: boolean }
  | { ok: false; problem: InvitationProblem };

/**
 * Accept an invitation as `userId`. Everything happens in one transaction
 * with the invitation row locked, so two clicks (or two tabs) can't both
 * create a membership or both pass the member cap:
 *
 * 1. the token matches a pending, unexpired invite of a live club;
 * 2. the logged-in user's verified email is the invited address;
 * 3. the membership is created (or a past one reactivated with the invited
 *    role) and the invite is marked accepted.
 *
 * An existing active membership is left as it is — the invite is still marked
 * accepted, and the caller is told so.
 */
export async function acceptInvitation(
  token: string,
  userId: string,
): Promise<AcceptOutcome> {
  if (!isWellFormedToken(token)) return { ok: false, problem: "invalid" };
  const tokenHash = hashInvitationToken(token);

  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select()
      .from(clubInvitations)
      .where(eq(clubInvitations.tokenHash, tokenHash))
      .limit(1)
      .for("update");
    if (!invite) return { ok: false, problem: "invalid" } as const;

    const [club] = await tx
      .select()
      .from(organizations)
      .where(eq(organizations.id, invite.organizationId))
      .limit(1);
    if (!club) return { ok: false, problem: "club_gone" } as const;

    const problem = statusProblem(invite, club.deletedAt);
    if (problem) return { ok: false, problem } as const;

    const [me] = await tx
      .select({ email: users.email, emailVerified: users.emailVerified })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    if (!me) return { ok: false, problem: "invalid" } as const;
    if (me.email.trim().toLowerCase() !== invite.email) {
      return { ok: false, problem: "wrong_email" } as const;
    }
    if (!me.emailVerified) {
      return { ok: false, problem: "unverified_email" } as const;
    }

    const role = invite.role === "organizer" ? "organizer" : "member";
    const now = new Date();

    const [membership] = await tx
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, club.id),
          eq(organizationMembers.userId, userId),
        ),
      )
      .limit(1)
      .for("update");

    const alreadyMember = !!membership && membership.leftAt === null;

    if (!alreadyMember) {
      // Same cap as at invite time: a club inside its trial resolves to Pro
      // and isn't capped.
      if (resolveEntitlement(club).tier === "free") {
        const [active] = await tx
          .select({ value: count() })
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.organizationId, club.id),
              isNull(organizationMembers.leftAt),
            ),
          );
        if ((active?.value ?? 0) >= FREE_TIER_MEMBER_LIMIT) {
          return { ok: false, problem: "member_limit" } as const;
        }
      }

      if (membership) {
        await tx
          .update(organizationMembers)
          .set({ leftAt: null, role, joinedAt: now })
          .where(eq(organizationMembers.id, membership.id));
      } else {
        await tx.insert(organizationMembers).values({
          organizationId: club.id,
          userId,
          role,
        });
      }
    }

    await tx
      .update(clubInvitations)
      .set({ acceptedAt: now, acceptedBy: userId })
      .where(eq(clubInvitations.id, invite.id));

    await tx.insert(auditLogs).values({
      userId,
      action: "club.invitation.accepted",
      entityType: "organization",
      entityId: club.id,
      metadata: { invitationId: invite.id, role, alreadyMember },
    });

    return { ok: true, clubSlug: club.slug, alreadyMember } as const;
  });
}

/**
 * Decline an invitation. Same identity checks as accepting (only the invited
 * person can decline), but no membership is touched.
 */
export async function declineInvitation(
  token: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; problem: InvitationProblem }> {
  if (!isWellFormedToken(token)) return { ok: false, problem: "invalid" };
  const tokenHash = hashInvitationToken(token);

  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select()
      .from(clubInvitations)
      .where(eq(clubInvitations.tokenHash, tokenHash))
      .limit(1)
      .for("update");
    if (!invite) return { ok: false, problem: "invalid" } as const;
    if (invite.acceptedAt) return { ok: false, problem: "used" } as const;
    if (invite.declinedAt) return { ok: true } as const;

    const [me] = await tx
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!me || me.email.trim().toLowerCase() !== invite.email) {
      return { ok: false, problem: "wrong_email" } as const;
    }

    await tx
      .update(clubInvitations)
      .set({ declinedAt: new Date() })
      .where(eq(clubInvitations.id, invite.id));

    await tx.insert(auditLogs).values({
      userId,
      action: "club.invitation.declined",
      entityType: "organization",
      entityId: invite.organizationId,
      metadata: { invitationId: invite.id },
    });

    return { ok: true } as const;
  });
}

/**
 * Create the pending invitation for `email`, or refresh the one that's already
 * pending (new token, new expiry, new role). Returns the raw token for the
 * email link — it exists only in this return value and the email.
 */
export async function upsertPendingInvitation(input: {
  organizationId: string;
  email: string;
  role: "member" | "organizer";
  invitedBy: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const { token, tokenHash } = createInvitationToken();
  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.transaction(async (tx) => {
    const [pending] = await tx
      .select({ id: clubInvitations.id })
      .from(clubInvitations)
      .where(
        and(
          eq(clubInvitations.organizationId, input.organizationId),
          eq(clubInvitations.email, input.email),
          isNull(clubInvitations.acceptedAt),
          isNull(clubInvitations.declinedAt),
        ),
      )
      .limit(1)
      .for("update");

    if (pending) {
      await tx
        .update(clubInvitations)
        .set({
          tokenHash,
          expiresAt,
          role: input.role,
          invitedBy: input.invitedBy,
        })
        .where(eq(clubInvitations.id, pending.id));
    } else {
      await tx.insert(clubInvitations).values({
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        tokenHash,
        expiresAt,
        invitedBy: input.invitedBy,
      });
    }
  });

  return { token, expiresAt };
}
