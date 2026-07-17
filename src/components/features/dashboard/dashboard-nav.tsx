"use client";

import {
  Calendar,
  LayoutDashboard,
  type LucideIcon,
  Map,
  Settings,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
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
      { href: club, label: "Përmbledhje", icon: LayoutDashboard, exact: true },
      { href: `${club}/trips`, label: "Udhëtimet", icon: Calendar },
      { href: `${club}?tab=members`, label: "Anëtarët", icon: Users },
      { href: `${club}?tab=settings`, label: "Cilësimet", icon: Settings },
    ];
  }
  return [
    { href: "/dashboard", label: "Paneli", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/my-trips", label: "Udhëtimet e mia", icon: Calendar },
    { href: "/clubs", label: "Klubet", icon: Users },
    { href: "/trails", label: "Shtigjet", icon: Map },
    { href: "/dashboard/profile", label: "Profili", icon: User },
  ];
}

/**
 * `usePathname()` never includes the query string, so a naive path-only
 * comparison can't tell "?tab=members" apart from "?tab=settings" (or from
 * no tab at all) — every same-path item would compare equal. Parse each
 * item's own `?tab=` (if any) and check it against the page's actual current
 * `tab` search param instead.
 */
function isActive(
  pathname: string,
  currentTab: string | null,
  item: NavItem,
): boolean {
  const [path, query] = item.href.split("?");
  const onPath = item.exact
    ? pathname === path
    : pathname === path || pathname.startsWith(`${path}/`);
  if (!onPath) return false;

  const itemTab = query ? new URLSearchParams(query).get("tab") : null;
  return itemTab ? currentTab === itemTab : !currentTab;
}

export function DashboardSidebar({
  variant,
  userName,
  secondaryLine,
  adminClubSlug,
}: DashboardNavProps) {
  const pathname = usePathname();
  const currentTab = useSearchParams().get("tab");
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
      <div className="flex flex-col items-center border-b border-summit/[0.06] px-2.5 py-3.5 text-center">
        {isAdmin ? (
          <>
            <Image
              src="/logos/Hikeit-pfp.png"
              alt=""
              width={28}
              height={28}
              className="mb-1.5 size-7"
            />
            <p className="font-heading text-[11px] font-extrabold tracking-[0.02em] text-summit uppercase">
              Balkan Clubs
            </p>
            <p className="mt-0.5 text-[8px] tracking-[0.04em] text-summit/30">
              Peak Control v1.2
            </p>
          </>
        ) : (
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1"
          >
            <Image
              src="/logos/Hikeit-pfp.png"
              alt=""
              width={28}
              height={28}
              className="size-7"
            />
            <span className="font-heading text-sm font-extrabold tracking-[-0.01em] text-moss uppercase">
              HikeIt
            </span>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 py-3">
        {items.map((item) => {
          const active = isActive(pathname, currentTab, item);
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
  const currentTab = useSearchParams().get("tab");
  const items = buildItems(variant, adminClubSlug).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-summit/[0.06] bg-abyss md:hidden">
      {items.map((item) => {
        const active = isActive(pathname, currentTab, item);
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
