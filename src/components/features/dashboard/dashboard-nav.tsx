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
import { usePathname } from "next/navigation";

import { Brand } from "@/components/shared/brand";
import { LogoutButton } from "@/components/shared/logout-button";
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
    { href: "/clubs", label: "Klube", icon: Users },
    { href: "/trails", label: "Shtigje", icon: Map },
    { href: "/dashboard/profile", label: "Profili", icon: User },
  ];
  if (adminClubSlug) {
    base.push({
      href: `/dashboard/club/${adminClubSlug}`,
      label: "Klubi im",
      icon: Building2,
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
  const items = buildItems(adminClubSlug);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-muted/20 md:flex">
      <div className="px-5 py-4">
        <Brand />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(pathname, item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {(userName || userEmail).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </div>
        <LogoutButton variant="ghost" />
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
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs",
            isActive(pathname, item.href)
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          <item.icon className="size-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
