"use client";

import Image from "next/image";
import Link from "next/link";
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
  // profile page and the trail proposal form are dark for everyone.
  const isForm = pathname.endsWith("/create") || pathname.endsWith("/edit");
  const isAlwaysDark =
    pathname.startsWith("/dashboard/profile") ||
    pathname === "/dashboard/trails/submit";
  const isLight =
    !isAlwaysDark &&
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
        {/* Phones only: the sidebar (with its logo) is hidden below md. On
            the dark bar the wordmark is Sage, not Moss — the bar is Forest,
            where Moss misses AA (4.43:1) and Sage clears it (7.09:1). */}
        <Link href="/" className="mr-auto flex items-center gap-2 md:hidden">
          <Image
            src="/logos/Hikeit-pfp.png"
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
          <span
            className={cn(
              "font-heading text-sm font-extrabold tracking-[-0.01em] uppercase",
              isLight ? "text-forest" : "text-sage",
            )}
          >
            HikeIt
          </span>
        </Link>
        <NotificationsBell light={isLight} />
        {/* Abyss chip, not Forest/Pine: Moss only clears AA on Abyss (6.32:1;
            4.43 on Forest, 2.74 on Pine). */}
        {/* Links to the profile on every variant: on phones Profili sits
            inside the bottom bar's "Më shumë" sheet. */}
        <Link
          href="/dashboard/profile"
          aria-label="Profili"
          className="bg-abyss text-moss hover:ring-moss/60 flex size-8 items-center justify-center text-xs font-bold transition-shadow hover:ring-2"
        >
          {displayName.charAt(0).toUpperCase()}
        </Link>
      </header>

      <main className="flex-1 px-6 py-5 pb-24 md:pb-5">{children}</main>
    </div>
  );
}
