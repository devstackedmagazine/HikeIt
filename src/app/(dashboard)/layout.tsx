import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  DashboardMobileTabs,
  DashboardSidebar,
} from "@/components/features/dashboard/dashboard-nav";
import { DashboardShell } from "@/components/features/dashboard/dashboard-shell";
import { getRequiredUser, getUserAdminClub } from "@/lib/auth/helpers";

/**
 * Authenticated dashboard shell. The content theme is role- and route-aware
 * (see DashboardShell): hikers light, admins dark on the overview home and
 * light on club-management pages. Also the onboarding gate — edge middleware
 * can't read the DB, so we enforce it here.
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
    <div className="min-h-svh bg-abyss">
      <DashboardSidebar
        variant={variant}
        userName={displayName}
        secondaryLine={isAdmin ? (adminClub?.name ?? "") : user.email}
        adminClubSlug={adminClub?.slug ?? null}
      />

      <DashboardShell variant={variant} displayName={displayName}>
        {children}
      </DashboardShell>

      <DashboardMobileTabs
        variant={variant}
        adminClubSlug={adminClub?.slug ?? null}
      />
    </div>
  );
}
