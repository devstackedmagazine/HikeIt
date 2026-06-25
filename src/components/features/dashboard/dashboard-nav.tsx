"use client";

import {
  Building2,
  Calendar,
  LayoutDashboard,
  type LucideIcon,
  Map,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export type DashboardVariant = "hiker" | "admin";

export interface DashboardNavProps {
  variant: DashboardVariant;
  userName: string;
  /** Secondary line under the name: email for hikers, club name for admins. */
  secondaryLine: string;
  adminClubSlug: string | null;
}

function buildItems(
  variant: DashboardVariant,
  adminClubSlug: string | null,
): NavItem[] {
  if (variant === "admin" && adminClubSlug) {
    const club = `/dashboard/club/${adminClubSlug}`;
    return [
      { href: "/dashboard", label: "Paneli", icon: LayoutDashboard },
      { href: club, label: "Klubi im", icon: Building2 },
      { href: `${club}?tab=trips`, label: "Udhëtimet", icon: Calendar },
      { href: `${club}?tab=members`, label: "Anëtarët", icon: Users },
    ];
  }
  return [
    { href: "/dashboard", label: "Paneli", icon: LayoutDashboard },
    { href: "/dashboard/my-trips", label: "Udhëtimet e mia", icon: Calendar },
    { href: "/clubs", label: "Klubet", icon: Users },
    { href: "/trails", label: "Shtigjet", icon: Map },
    { href: "/dashboard/profile", label: "Profili", icon: User },
  ];
}

function isActive(pathname: string, href: string): boolean {
  const path = href.split("?")[0] ?? href;
  if (path === "/dashboard") return pathname === "/dashboard";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function DashboardSidebar({
  variant,
  userName,
  secondaryLine,
  adminClubSlug,
}: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const items = buildItems(variant, adminClubSlug);
  const isAdmin = variant === "admin";

  async function logout() {
    setLoggingOut(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="fixed top-0 left-0 z-50 hidden h-screen w-28 flex-col border-r border-summit/[0.06] bg-abyss md:flex">
      {/* Logo */}
      <div className="border-b border-summit/[0.06] px-3 py-3.5">
        <p className="font-heading text-xs font-extrabold tracking-[0.02em] text-moss uppercase">
          {isAdmin ? "Hike Admin" : "HikeIt"}
        </p>
        {isAdmin ? (
          <p className="mt-0.5 text-[9px] text-summit/30">Vëzhgues i Majave</p>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 py-3">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-2.5 text-center transition-colors",
                active
                  ? "bg-moss text-abyss"
                  : "text-summit/35 hover:bg-summit/[0.04] hover:text-summit/70",
              )}
            >
              <item.icon className="size-[18px]" />
              <span className="text-[9px] leading-tight font-semibold tracking-[0.04em] uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="flex flex-col items-center gap-1.5 border-t border-summit/[0.06] p-3">
        <span
          className={cn(
            "flex size-8 items-center justify-center border border-moss/30 text-xs font-bold text-moss",
            isAdmin ? "bg-pine" : "bg-forest",
          )}
        >
          {userName.charAt(0).toUpperCase()}
        </span>
        <p className="text-center text-[9px] font-semibold tracking-[0.04em] text-summit/60 uppercase">
          {isAdmin ? "Admin" : userName}
        </p>
        <p className="w-full truncate text-center text-[8px] tracking-[0.04em] text-summit/30 uppercase">
          {secondaryLine}
        </p>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="text-[9px] font-semibold tracking-[0.06em] text-danger uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          ← Çkyçu
        </button>
      </div>
    </aside>
  );
}

/** Mobile bottom tab bar (sidebar is hidden on small screens). */
export function DashboardMobileTabs({
  variant,
  adminClubSlug,
}: {
  variant: DashboardVariant;
  adminClubSlug: string | null;
}) {
  const pathname = usePathname();
  const items = buildItems(variant, adminClubSlug).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-summit/[0.06] bg-abyss md:hidden">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-semibold uppercase",
              active ? "text-moss" : "text-summit/35",
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
