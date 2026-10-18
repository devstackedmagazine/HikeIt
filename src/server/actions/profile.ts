"use server";

import { and, eq, gt, inArray, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getOptionalSession } from "@/lib/auth/helpers";
import { isCloudinaryConfigured } from "@/lib/cloudinary/client";
import { releaseImage } from "@/lib/cloudinary/ownership";
import { uploadImage } from "@/lib/cloudinary/upload";
import { getImageUrl } from "@/lib/cloudinary/urls";
import { db } from "@/lib/db";
import {
  accounts,
  hikes,
  imageHashes,
  notifications,
  organizationMembers,
  organizations,
  sessions,
  trailFavorites,
  trailPhotos,
  tripFavorites,
  tripPhotos,
  tripRegistrations,
  trips,
  users,
  verifications,
} from "@/lib/db/schema";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureError } from "@/lib/sentry";

export interface ActionResult {
  success: boolean;
  error?: string;
}

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  emergencyContactName: z.string().trim().max(100).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function updateProfile(
  data: UpdateProfileInput,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Të dhëna të pavlefshme." };
  }
  const d = parsed.data;

  await db
    .update(users)
    // Partial update: only fields the caller sent are written (an empty
    // string clears a field). Preferences are never touched here — they have
    // their own merge-based action, `updatePreferences`.
    .set({
      ...(d.name !== undefined && { name: d.name }),
      ...(d.bio !== undefined && { bio: d.bio || null }),
      ...(d.phone !== undefined && { phone: d.phone || null }),
      ...(d.dateOfBirth !== undefined && {
        dateOfBirth: d.dateOfBirth || null,
      }),
      ...(d.emergencyContactName !== undefined && {
        emergencyContactName: d.emergencyContactName || null,
      }),
      ...(d.emergencyContactPhone !== undefined && {
        emergencyContactPhone: d.emergencyContactPhone || null,
      }),
    })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

export interface AvatarResult extends ActionResult {
  avatarUrl?: string;
}

/**
 * Avatars go through the shared Cloudinary pipeline (`uploadImage`): MIME
 * allowlist, magic bytes, size cap, SHA-256 dedupe, EXIF stripping and the
 * hourly upload limit all come from there — there is no avatar-specific
 * image path.
 *
 * The pipeline is called directly rather than via /api/upload + a follow-up
 * action, so the avatar is always the file this request uploaded, never a
 * publicId supplied by the client.
 *
 * The previous avatar is intentionally left in Cloudinary: dedupe means one
 * asset can back several records, so deleting it could break someone else's.
 */
export async function updateAvatar(formData: FormData): Promise<AvatarResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };
  if (!isCloudinaryConfigured()) {
    return { success: false, error: "Ngarkimi nuk është konfiguruar." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return { success: false, error: "Skedar i pavlefshëm." };
  }

  try {
    const uploaded = await uploadImage(
      Buffer.from(await file.arrayBuffer()),
      file.type,
      file.name,
      {
        entityType: "avatar",
        entityId: session.user.id,
        userId: session.user.id,
      },
    );
    // Store the 200×200 face-cropped delivery URL — a full URL, like the
    // OAuth provider photos already in this column.
    const avatarUrl = getImageUrl(uploaded.publicId, "avatar");
    await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, session.user.id));
    // The header, sidebar and public navbar render this column from server
    // components; drop their cached output so the new photo shows at once.
    revalidatePath("/", "layout");
    return { success: true, avatarUrl };
  } catch (error) {
    // Report only what KIND of failure this was — never the message (it can
    // echo file details), the file, or who uploaded it. No userId is passed,
    // so no user is attached to the event.
    captureError(new Error(`updateAvatar failed: ${avatarErrorKind(error)}`), {
      action: "updateAvatar",
    });
    // uploadImage throws user-facing Albanian messages for validation, the
    // rate limit and missing config; anything else is unexpected.
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ngarkimi dështoi.",
    };
  }
}

/** Failure category for Sentry: Cloudinary API errors carry `http_code`;
 * everything else is reported by its constructor name. */
function avatarErrorKind(error: unknown): string {
  if (error && typeof error === "object" && "http_code" in error) {
    return `cloudinary_${String((error as { http_code: unknown }).http_code)}`;
  }
  if (error instanceof Error) return error.name;
  return typeof error;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };
  if (data.newPassword.length < 10) {
    return {
      success: false,
      error: "Fjalëkalimi duhet të ketë 10+ karaktere.",
    };
  }

  // This action verifies `currentPassword`, so it's an online guessing target
  // even though the caller is authenticated — throttle before the check.
  const limited = await enforceRateLimit("ratelimit.profile.change_password", {
    userId: session.user.id,
  });
  if (limited) return { success: false, error: limited };

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      headers: await headers(),
    });
    return { success: true };
  } catch {
    return { success: false, error: "Fjalëkalimi aktual është i gabuar." };
  }
}

/** Thrown inside the deletion transaction to abort it with a user message. */
class DeletionBlocked extends Error {}

/**
 * Delete the signed-in user's account: immediate and permanent.
 *
 * Refused (nothing changes) when the user is the last super admin, or the
 * only admin of a club that still exists — the club must never be left
 * without someone who can manage it. Both checks run inside the transaction
 * with row locks, so two admins deleting at once can't both pass.
 *
 * Redirects home on success; otherwise returns the reason.
 */
export async function deleteAccount(
  confirmation: string,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) redirect("/login");

  const limited = await enforceRateLimit("ratelimit.profile.delete_account", {
    userId: session.user.id,
  });
  if (limited) return { success: false, error: limited };

  if (confirmation.trim().toLowerCase() !== session.user.email.toLowerCase()) {
    return { success: false, error: "Email-i nuk përputhet." };
  }

  const userId = session.user.id;
  const now = new Date();
  let photoIds: string[] = [];

  // The whole database part is one transaction: every write happens, or —
  // if a guard throws — none does. Cloudinary is only touched after commit.
  // The user row itself is kept (past registrations, reviews and trail
  // proposals point at it) but every personal field is wiped and the login
  // methods are deleted, so the account can't be signed into or restored.
  try {
    await db.transaction(async (tx) => {
      const [me] = await tx
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .for("update");
      if (me?.role === "super_admin") {
        const others = await tx
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.role, "super_admin"),
              isNull(users.deletedAt),
              ne(users.id, userId),
            ),
          )
          .for("update");
        if (others.length === 0) {
          throw new DeletionBlocked(
            "Jeni super administratori i fundit i HikeIt. Caktoni një super administrator tjetër para se të fshini llogarinë.",
          );
        }
      }

      const adminOf = await tx
        .select({ id: organizations.id, name: organizations.name })
        .from(organizationMembers)
        .innerJoin(
          organizations,
          eq(organizations.id, organizationMembers.organizationId),
        )
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.role, "admin"),
            isNull(organizationMembers.leftAt),
            isNull(organizations.deletedAt),
          ),
        );
      for (const club of adminOf) {
        const otherAdmins = await tx
          .select({ id: organizationMembers.id })
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.organizationId, club.id),
              eq(organizationMembers.role, "admin"),
              isNull(organizationMembers.leftAt),
              ne(organizationMembers.userId, userId),
            ),
          )
          .for("update");
        if (otherAdmins.length === 0) {
          throw new DeletionBlocked(
            `Jeni administratori i vetëm i klubit „${club.name}". Caktoni një administrator tjetër ose fshini klubin para se të fshini llogarinë.`,
          );
        }
      }

      // Images to release after commit: photos the user posted, and every
      // avatar they uploaded (current and past).
      photoIds = [
        ...(await tx
          .select({ id: tripPhotos.cloudinaryPublicId })
          .from(tripPhotos)
          .where(eq(tripPhotos.userId, userId))),
        ...(await tx
          .select({ id: trailPhotos.cloudinaryPublicId })
          .from(trailPhotos)
          .where(eq(trailPhotos.userId, userId))),
        ...(await tx
          .select({ id: imageHashes.cloudinaryPublicId })
          .from(imageHashes)
          .where(
            and(
              eq(imageHashes.uploadedBy, userId),
              eq(imageHashes.entityType, "avatar"),
            ),
          )),
      ].map((r) => r.id);

      await tx.delete(hikes).where(eq(hikes.userId, userId));
      await tx.delete(tripPhotos).where(eq(tripPhotos.userId, userId));
      await tx.delete(trailPhotos).where(eq(trailPhotos.userId, userId));
      await tx.delete(trailFavorites).where(eq(trailFavorites.userId, userId));
      await tx.delete(tripFavorites).where(eq(tripFavorites.userId, userId));
      await tx.delete(notifications).where(eq(notifications.userId, userId));
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      // Pending password-reset tokens store the user id as their value; a
      // leftover one could otherwise recreate a password login.
      await tx.delete(verifications).where(eq(verifications.value, userId));

      // Free the seat on trips that haven't started; past ones stay as history.
      const upcoming = tx
        .select({ id: trips.id })
        .from(trips)
        .where(gt(trips.startDatetime, now));
      await tx
        .update(tripRegistrations)
        .set({ status: "canceled", canceledAt: now })
        .where(
          and(
            eq(tripRegistrations.userId, userId),
            inArray(tripRegistrations.status, [
              "confirmed",
              "waitlisted",
              "pending",
            ]),
            inArray(tripRegistrations.tripId, upcoming),
          ),
        );
      // Every club they admin still has another admin (checked above), so
      // leaving and dropping `ownerId` never orphans a club.
      await tx
        .update(organizationMembers)
        .set({ leftAt: now })
        .where(
          and(
            eq(organizationMembers.userId, userId),
            isNull(organizationMembers.leftAt),
          ),
        );
      await tx
        .update(organizations)
        .set({ ownerId: null })
        .where(eq(organizations.ownerId, userId));

      await tx
        .update(users)
        .set({
          email: `deleted-${userId}@deleted.invalid`,
          emailVerified: false,
          name: "Përdorues i fshirë",
          avatarUrl: null,
          bio: null,
          phone: null,
          dateOfBirth: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
          preferences: null,
          deletedAt: now,
        })
        .where(eq(users.id, userId));
    });
  } catch (error) {
    if (error instanceof DeletionBlocked) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  // Committed. `releaseImage` destroys a file only when no column in any
  // table still references it (trip/trail photos, trip/trail covers, club
  // logo/cover, avatars), so a club logo or trip cover that shares an asset
  // with one of these photos survives. Best effort: failures are reported to
  // Sentry and leave an unreferenced file behind.
  await Promise.all(
    [...new Set(photoIds)].map((id) => releaseImage(id, userId)),
  );

  // The session row is already deleted; this clears the browser cookie.
  await auth.api.signOut({ headers: await headers() }).catch(() => undefined);
  redirect("/");
}

const preferencesSchema = z.object({
  language: z.enum(["sq", "en"]).optional(),
  alertSensitivity: z.enum(["low", "medium", "high"]).optional(),
});

/** Merge a partial preferences patch into the user's stored preferences. */
export async function updatePreferences(
  patch: z.infer<typeof preferencesSchema>,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const parsed = preferencesSchema.safeParse(patch);
  if (!parsed.success) {
    return { success: false, error: "Të dhëna të pavlefshme." };
  }

  const current = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { preferences: true },
  });
  const merged = { ...(current?.preferences ?? {}), ...parsed.data };

  await db
    .update(users)
    .set({ preferences: merged })
    .where(eq(users.id, session.user.id));

  return { success: true };
}
