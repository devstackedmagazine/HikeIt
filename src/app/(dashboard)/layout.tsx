import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  DashboardMobileTabs,
  DashboardSidebar,
} from "@/components/features/dashboard/dashboard-nav";
import { NotificationsBell } from "@/components/features/notifications/notifications-bell";
import { SearchCommand } from "@/components/features/search/search-command";
import { Brand } from "@/components/shared/brand";
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
        <header className="flex items-center justify-between gap-3 border-b px-4 py-2 sm:px-8">
          <Brand className="inline-flex md:hidden" />
          <div className="ml-auto flex items-center gap-2">
            <SearchCommand />
            <NotificationsBell />
          </div>
        </header>
        <main className="flex-1 px-4 pt-6 pb-20 sm:px-8 md:pb-8">
          {children}
        </main>
      </div>
      <DashboardMobileTabs adminClubSlug={adminClub?.slug ?? null} />
    </div>
  );
}
