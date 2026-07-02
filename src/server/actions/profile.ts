"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isR2Configured, uploadFile } from "@/lib/storage/r2";

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

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function updateAvatar(formData: FormData): Promise<AvatarResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };
  if (!isR2Configured()) {
    return { success: false, error: "Ngarkimi nuk është konfiguruar." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return { success: false, error: "Skedar i pavlefshëm." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Vetëm imazhe lejohen." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { success: false, error: "Imazhi tejkalon 2MB." };
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadFile(
      `avatars/${session.user.id}.${ext}`,
      buffer,
      file.type,
    );
    // Cache-bust so the new image shows immediately.
    const avatarUrl = `${url}?v=${Date.now()}`;
    await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, session.user.id));
    return { success: true, avatarUrl };
  } catch {
    return { success: false, error: "Ngarkimi dështoi." };
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

  if (confirmation.trim().toLowerCase() !== session.user.email.toLowerCase()) {
    return;
  }

  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.id, session.user.id));

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
