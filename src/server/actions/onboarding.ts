"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getRequiredSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Finish onboarding as a hiker and head to the dashboard. */
export async function completeOnboardingAsHiker(): Promise<void> {
  const session = await getRequiredSession();
  await finishOnboarding(session.user.id, "hiker");
  redirect("/dashboard");
}

/**
 * Sets the chosen role, except on a super admin, whose role never changes:
 * these actions can be called at any time, and the choice must never remove
 * the last one. The role test is part of each UPDATE, so there is no gap
 * between reading the role and writing it.
 */
async function finishOnboarding(
  userId: string,
  chosen: "hiker" | "club_admin",
): Promise<void> {
  await db
    .update(users)
    .set({ role: chosen, onboardingCompleted: true })
    .where(and(eq(users.id, userId), ne(users.role, "super_admin")));
  await db
    .update(users)
    .set({ onboardingCompleted: true })
    .where(and(eq(users.id, userId), eq(users.role, "super_admin")));
}

/** Mark the user as a club admin and send them to the club creation wizard. */
export async function startClubRegistration(): Promise<void> {
  const session = await getRequiredSession();
  await finishOnboarding(session.user.id, "club_admin");
  redirect("/dashboard/club/create");
}
