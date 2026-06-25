import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  DashboardMobileTabs,
  DashboardSidebar,
} from "@/components/features/dashboard/dashboard-nav";
import { NotificationsBell } from "@/components/features/notifications/notifications-bell";
import { getRequiredUser, getUserAdminClub } from "@/lib/auth/helpers";

/**
 * Authenticated dashboard shell: narrow dark sidebar + light (Mist) content
 * area. Also the onboarding gate — edge middleware can't read the DB, so we
 * enforce it here.
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

  const displayName = user.name ?? user.email;

  return (
    <div className="min-h-svh bg-mist">
      <DashboardSidebar
        userName={displayName}
        userEmail={user.email}
        adminClubSlug={adminClub?.slug ?? null}
      />

      <div className="flex min-h-svh min-w-0 flex-col md:ml-28">
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-forest/10 bg-mist px-6">
          <span className="font-heading text-base font-extrabold tracking-[-0.01em] text-forest uppercase md:hidden">
            HikeIt
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            <NotificationsBell />
            <span className="flex size-8 items-center justify-center bg-forest text-xs font-bold text-moss">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="flex-1 px-6 py-5 pb-24 md:pb-5">{children}</main>
      </div>

      <DashboardMobileTabs adminClubSlug={adminClub?.slug ?? null} />
    </div>
  );
}
