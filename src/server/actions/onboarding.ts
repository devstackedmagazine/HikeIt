"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getRequiredSession } from "@/lib/auth/helpers";
import { roleAfterOnboarding } from "@/lib/clubs/admin-rules";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Finish onboarding as a hiker and head to the dashboard. */
export async function completeOnboardingAsHiker(): Promise<void> {
  const session = await getRequiredSession();
  await finishOnboarding(session.user.id, "hiker");
  redirect("/dashboard");
}

/** Sets the chosen role, except on a super admin, whose role never changes. */
async function finishOnboarding(
  userId: string,
  chosen: "hiker" | "club_admin",
): Promise<void> {
  const me = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true },
  });
  if (!me) return;
  await db
    .update(users)
    .set({
      role: roleAfterOnboarding(me.role, chosen),
      onboardingCompleted: true,
    })
    .where(eq(users.id, userId));
}

/** Mark the user as a club admin and send them to the club creation wizard. */
export async function startClubRegistration(): Promise<void> {
  const session = await getRequiredSession();
  await finishOnboarding(session.user.id, "club_admin");
  redirect("/dashboard/club/create");
}
