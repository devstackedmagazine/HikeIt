import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  DashboardMobileTabs,
  DashboardSidebar,
} from "@/components/features/dashboard/dashboard-nav";
import { getRequiredUser, getUserAdminClub } from "@/lib/auth/helpers";

/**
 * Authenticated dashboard shell: role-aware sidebar + mobile tabs. Also the
 * onboarding gate — edge middleware can't read the DB, so we enforce it here.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getRequiredUser();
  if (!user.onboardingCompleted) redirect("/onboarding");

  const adminClub =
    user.role === "club_admin" ? await getUserAdminClub(user.id) : null;

  return (
    <div className="flex min-h-svh">
      <DashboardSidebar
        userName={user.name ?? user.email}
        userEmail={user.email}
        adminClubSlug={adminClub?.slug ?? null}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 pb-20 pt-6 sm:px-8 md:pb-8">
          {children}
        </main>
      </div>
      <DashboardMobileTabs adminClubSlug={adminClub?.slug ?? null} />
    </div>
  );
}
