"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getRequiredSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Finish onboarding as a hiker and head to the dashboard. */
export async function completeOnboardingAsHiker(): Promise<void> {
  const session = await getRequiredSession();
  await db
    .update(users)
    .set({ role: "hiker", onboardingCompleted: true })
    .where(eq(users.id, session.user.id));
  redirect("/dashboard");
}

/** Mark the user as a club admin and send them to the club creation wizard. */
export async function startClubRegistration(): Promise<void> {
  const session = await getRequiredSession();
  await db
    .update(users)
    .set({ role: "club_admin", onboardingCompleted: true })
    .where(eq(users.id, session.user.id));
  redirect("/dashboard/club/create");
}
