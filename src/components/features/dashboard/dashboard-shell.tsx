"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { NotificationsBell } from "@/components/features/notifications/notifications-bell";
import { cn } from "@/lib/utils/cn";

import type { DashboardVariant } from "./dashboard-nav";

/**
 * Themes the dashboard content column by route. Hikers are always light; admins
 * are dark on the overview home but light on club-management pages
 * (`/dashboard/club/*`), matching each view's design.
 */
export function DashboardShell({
  variant,
  displayName,
  children,
}: {
  variant: DashboardVariant;
  displayName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // Club-management pages are light, except the create/edit trip forms; the
  // profile page is dark for everyone.
  const isForm = pathname.endsWith("/create") || pathname.endsWith("/edit");
  const isProfile = pathname.startsWith("/dashboard/profile");
  const isLight =
    !isProfile &&
    (variant === "hiker" ||
      (pathname.startsWith("/dashboard/club/") && !isForm));

  return (
    <div
      className={cn(
        "flex min-h-svh min-w-0 flex-col md:ml-28",
        isLight ? "bg-mist" : "bg-forest",
      )}
    >
      <header
        className={cn(
          "sticky top-0 z-40 flex h-12 items-center justify-end gap-2.5 border-b px-6",
          isLight
            ? "border-forest/10 bg-mist"
            : "border-summit/[0.08] bg-forest",
        )}
      >
        <NotificationsBell light={isLight} />
        <span
          className={cn(
            "flex size-8 items-center justify-center text-xs font-bold text-moss",
            isLight ? "bg-forest" : "bg-pine",
          )}
        >
          {displayName.charAt(0).toUpperCase()}
        </span>
      </header>

      <main className="flex-1 px-6 py-5 pb-24 md:pb-5">{children}</main>
    </div>
  );
}
