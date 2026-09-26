"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getOptionalSession } from "@/lib/auth/helpers";
import { isCloudinaryConfigured } from "@/lib/cloudinary/client";
import { uploadImage } from "@/lib/cloudinary/upload";
import { getImageUrl } from "@/lib/cloudinary/urls";
import { db } from "@/lib/db";
import { hikes, users } from "@/lib/db/schema";
import { enforceRateLimit } from "@/lib/security/rate-limit";

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
  preferences: z
    .object({
      language: z.enum(["sq", "en"]).optional(),
      alertSensitivity: z.enum(["low", "medium", "high"]).optional(),
    })
    .optional(),
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
    .set({
      name: d.name,
      bio: d.bio || null,
      phone: d.phone || null,
      dateOfBirth: d.dateOfBirth || null,
      emergencyContactName: d.emergencyContactName || null,
      emergencyContactPhone: d.emergencyContactPhone || null,
      preferences: d.preferences,
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
    return { success: true, avatarUrl };
  } catch (error) {
    // uploadImage throws user-facing Albanian messages for validation, the
    // rate limit and missing config; anything else is unexpected.
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ngarkimi dështoi.",
    };
  }
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };
  if (data.newPassword.length < 10) {
    return { success: false, error: "Fjalëkalimi duhet të ketë 10+ karaktere." };
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

export async function deleteAccount(confirmation: string): Promise<void> {
  const session = await getOptionalSession();
  if (!session) redirect("/login");

  // Throttled before the confirmation check. This action returns void, so —
  // like a failed confirmation — a throttled call just returns without
  // deleting; there's no channel to report the reason.
  const limited = await enforceRateLimit("ratelimit.profile.delete_account", {
    userId: session.user.id,
  });
  if (limited) return;

  if (confirmation.trim().toLowerCase() !== session.user.email.toLowerCase()) {
    return;
  }

  // The user row is only soft-deleted, which cascades nothing, so hikes —
  // personal location data — are hard-deleted explicitly, in the same
  // transaction: both happen or neither does.
  await db.transaction(async (tx) => {
    await tx.delete(hikes).where(eq(hikes.userId, session.user.id));
    await tx
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, session.user.id));
  });

  await auth.api.signOut({ headers: await headers() });
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
