"use client";

import {
  Building2,
  Calendar,
  CreditCard,
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

export interface DashboardNavProps {
  userName: string;
  userEmail: string;
  adminClubSlug: string | null;
}

function buildItems(adminClubSlug: string | null): NavItem[] {
  const base: NavItem[] = [
    { href: "/dashboard", label: "Paneli", icon: LayoutDashboard },
    { href: "/dashboard/my-trips", label: "Udhëtimet e mia", icon: Calendar },
    { href: "/clubs", label: "Klubet", icon: Users },
    { href: "/trails", label: "Shtigjet", icon: Map },
    { href: "/dashboard/profile", label: "Profili", icon: User },
  ];
  if (adminClubSlug) {
    base.push({
      href: `/dashboard/club/${adminClubSlug}`,
      label: "Klubi im",
      icon: Building2,
    });
    base.push({
      href: "/dashboard/billing",
      label: "Faturimi",
      icon: CreditCard,
    });
  }
  return base;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({
  userName,
  userEmail,
  adminClubSlug,
}: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const items = buildItems(adminClubSlug);

  async function logout() {
    setLoggingOut(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="fixed top-0 left-0 z-50 hidden h-screen w-28 flex-col border-r border-summit/[0.06] bg-abyss md:flex">
      {/* Logo */}
      <div className="border-b border-summit/[0.06] px-3 py-4">
        <Link
          href="/dashboard"
          className="font-heading text-sm font-extrabold tracking-[-0.01em] text-moss uppercase"
        >
          HikeIt
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 py-4">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
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
        <span className="flex size-8 items-center justify-center border border-moss/30 bg-forest text-xs font-bold text-moss">
          {userName.charAt(0).toUpperCase()}
        </span>
        <p className="text-center text-[9px] font-semibold tracking-[0.04em] text-summit/60 uppercase">
          {userName}
        </p>
        <p className="w-full truncate text-center text-[8px] text-summit/30">
          {userEmail}
        </p>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="text-[9px] font-semibold tracking-[0.06em] text-danger uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          + Dil
        </button>
      </div>
    </aside>
  );
}

/** Mobile bottom tab bar (sidebar is hidden on small screens). */
export function DashboardMobileTabs({
  adminClubSlug,
}: {
  adminClubSlug: string | null;
}) {
  const pathname = usePathname();
  const items = buildItems(adminClubSlug).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-summit/[0.06] bg-abyss md:hidden">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
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
