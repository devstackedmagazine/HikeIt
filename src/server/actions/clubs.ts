"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema";

export interface ActionResult {
  success: boolean;
  error?: string;
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
