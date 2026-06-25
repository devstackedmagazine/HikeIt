import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  DashboardMobileTabs,
  DashboardSidebar,
} from "@/components/features/dashboard/dashboard-nav";
import { NotificationsBell } from "@/components/features/notifications/notifications-bell";
import { getRequiredUser, getUserAdminClub } from "@/lib/auth/helpers";
import { cn } from "@/lib/utils/cn";

/**
 * Authenticated dashboard shell. The content theme is role-aware: hikers get a
 * light Mist area, club admins get a dark Forest area. Also the onboarding gate
 * — edge middleware can't read the DB, so we enforce it here.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getRequiredUser();
  if (!user.onboardingCompleted) redirect("/onboarding");

  const isAdmin = user.role === "club_admin";
  const adminClub = isAdmin ? await getUserAdminClub(user.id) : null;

  const displayName = user.name ?? user.email;
  const variant = isAdmin ? "admin" : "hiker";

  return (
    <div className={cn("min-h-svh", isAdmin ? "bg-forest" : "bg-mist")}>
      <DashboardSidebar
        variant={variant}
        userName={displayName}
        secondaryLine={isAdmin ? (adminClub?.name ?? "") : user.email}
        adminClubSlug={adminClub?.slug ?? null}
      />

      <div className="flex min-h-svh min-w-0 flex-col md:ml-28">
        <header
          className={cn(
            "sticky top-0 z-40 flex h-12 items-center justify-between px-6",
            isAdmin
              ? "border-b border-summit/[0.08] bg-forest"
              : "border-b border-forest/10 bg-mist",
          )}
        >
          <span
            className={cn(
              "font-heading text-base font-extrabold tracking-[-0.01em] uppercase",
              isAdmin ? "text-summit" : "text-forest md:hidden",
            )}
          >
            {isAdmin ? "Paneli" : "HikeIt"}
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            <NotificationsBell />
            <span
              className={cn(
                "flex size-8 items-center justify-center text-xs font-bold text-moss",
                isAdmin ? "bg-pine" : "bg-forest",
              )}
            >
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="flex-1 px-6 py-5 pb-24 md:pb-5">{children}</main>
      </div>

      <DashboardMobileTabs
        variant={variant}
        adminClubSlug={adminClub?.slug ?? null}
      />
    </div>
  );
}
