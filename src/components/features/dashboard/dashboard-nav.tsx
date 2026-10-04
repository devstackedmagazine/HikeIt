"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  Calendar,
  Footprints,
  Heart,
  LayoutDashboard,
  type LucideIcon,
  Map,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { UserAvatar } from "@/components/shared/user-avatar";
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
  avatarUrl: string | null;
  /** Secondary line under the name: email for hikers, club name for admins. */
  secondaryLine: string;
  adminClubSlug: string | null;
  /** Super admins only — adds the platform admin panel to the nav. */
  showAdminPanel?: boolean;
}

function buildItems(
  variant: DashboardVariant,
  adminClubSlug: string | null,
  showAdminPanel = false,
): NavItem[] {
  const platformAdmin: NavItem[] = showAdminPanel
    ? [{ href: "/dashboard/admin", label: "Admin", icon: ShieldCheck }]
    : [];

  if (variant === "admin" && adminClubSlug) {
    const club = `/dashboard/club/${adminClubSlug}`;
    return [
      // The club's home is /dashboard (the page club admins land on after
      // login); /dashboard/club/[slug] only hosts the members/settings tabs.
      {
        href: "/dashboard",
        label: "Përmbledhje",
        icon: LayoutDashboard,
        exact: true,
      },
      { href: `${club}/trips`, label: "Udhëtimet", icon: Calendar },
      { href: `${club}?tab=members`, label: "Anëtarët", icon: Users },
      {
        href: `${club}?tab=settings#invite-code`,
        label: "Përmirëso",
        icon: Sparkles,
      },
      { href: `${club}?tab=settings`, label: "Cilësimet", icon: Settings },
      ...platformAdmin,
    ];
  }
  return [
    { href: "/dashboard", label: "Paneli", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/my-trips", label: "Udhëtimet e mia", icon: Calendar },
    { href: "/dashboard/hikes", label: "Ecjet e mia", icon: Footprints },
    { href: "/dashboard/trails", label: "Të ruajtura", icon: Heart },
    { href: "/clubs", label: "Klubet", icon: Users },
    { href: "/trails", label: "Shtigjet", icon: Map },
    { href: "/dashboard/profile", label: "Profili", icon: User },
    ...platformAdmin,
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

  // Strip a trailing #fragment (e.g. "#invite-code") before parsing — it's
  // not part of the query string, and URLSearchParams would otherwise fold it
  // into the tab value and break the comparison below.
  const queryOnly = query?.split("#")[0];
  const itemTab = queryOnly ? new URLSearchParams(queryOnly).get("tab") : null;
  return itemTab ? currentTab === itemTab : !currentTab;
}

export function DashboardSidebar({
  variant,
  userName,
  avatarUrl,
  secondaryLine,
  adminClubSlug,
  showAdminPanel = false,
}: DashboardNavProps) {
  const pathname = usePathname();
  const currentTab = useSearchParams().get("tab");
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const items = buildItems(variant, adminClubSlug, showAdminPanel);
  const isAdmin = variant === "admin";

  async function logout() {
    setLoggingOut(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="border-summit/[0.06] bg-abyss fixed top-0 left-0 z-50 hidden h-screen w-28 flex-col border-r md:flex">
      {/* Logo */}
      <div className="border-summit/[0.06] flex flex-col items-center border-b px-2.5 py-3.5 text-center">
        {isAdmin ? (
          // The whole block is the home link, not just the image.
          <Link href="/dashboard" className="flex flex-col items-center">
            <Image
              src="/logos/Hikeit-pfp.png"
              alt=""
              width={28}
              height={28}
              className="mb-1.5 size-7"
            />
            <span className="font-heading text-summit text-[11px] font-extrabold tracking-[0.02em] uppercase">
              Balkan Clubs
            </span>
            <span className="text-summit/50 mt-0.5 text-[8px] tracking-[0.04em]">
              Peak Control v1.2
            </span>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex flex-col items-center gap-1">
            <Image
              src="/logos/Hikeit-pfp.png"
              alt=""
              width={28}
              height={28}
              className="size-7"
            />
            <span className="font-heading text-moss text-sm font-extrabold tracking-[-0.01em] uppercase">
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
                  : "text-summit/50 hover:bg-summit/[0.04] hover:text-summit/70",
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
      <div className="border-summit/[0.06] flex flex-col items-center gap-1.5 border-t p-3">
        {/* Abyss chip, not Forest/Pine: Moss only clears AA on Abyss. */}
        <UserAvatar
          name={userName}
          src={avatarUrl}
          className="border-moss/30 border"
        />
        <p className="text-summit/60 text-center text-[9px] font-semibold tracking-[0.04em] uppercase">
          {isAdmin ? "Admin" : userName}
        </p>
        <p className="text-summit/50 w-full truncate text-center text-[8px] tracking-[0.04em] uppercase">
          {secondaryLine}
        </p>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="text-danger text-[9px] font-semibold tracking-[0.06em] uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          ← Çkyçu
        </button>
      </div>
    </aside>
  );
}

/** Most slots the mobile bar shows before it needs an overflow button. */
const MOBILE_SLOTS = 5;

/**
 * Mobile bottom tab bar (sidebar is hidden on small screens).
 *
 * Five slots fit a phone. With five items or fewer every item gets one; with
 * more, the first four stay and the fifth slot becomes "Më shumë", opening a
 * sheet with the rest — nothing is ever silently dropped. "Më shumë" takes
 * the active state when the current page is one of the items inside it.
 */
export function DashboardMobileTabs({
  variant,
  userName,
  avatarUrl,
  adminClubSlug,
  showAdminPanel = false,
}: {
  variant: DashboardVariant;
  userName: string;
  avatarUrl: string | null;
  adminClubSlug: string | null;
  showAdminPanel?: boolean;
}) {
  const pathname = usePathname();
  const currentTab = useSearchParams().get("tab");
  const [moreOpen, setMoreOpen] = useState(false);
  const items = buildItems(variant, adminClubSlug, showAdminPanel);

  const overflows = items.length > MOBILE_SLOTS;
  const bar = overflows ? items.slice(0, MOBILE_SLOTS - 1) : items;
  const more = overflows ? items.slice(MOBILE_SLOTS - 1) : [];
  const moreActive = more.some((item) => isActive(pathname, currentTab, item));

  return (
    <nav
      aria-label="Navigimi"
      className="border-summit/[0.06] bg-abyss fixed inset-x-0 bottom-0 z-40 flex border-t pb-[env(safe-area-inset-bottom,0px)] md:hidden"
    >
      {bar.map((item) => {
        const active = isActive(pathname, currentTab, item);
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-center text-[9px] leading-tight font-semibold uppercase",
              active ? "text-moss" : "text-summit/50",
            )}
          >
            <item.icon className="size-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      {overflows ? (
        <DialogPrimitive.Root open={moreOpen} onOpenChange={setMoreOpen}>
          <DialogPrimitive.Trigger
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-center text-[9px] leading-tight font-semibold uppercase",
              moreActive || moreOpen ? "text-moss" : "text-summit/50",
            )}
          >
            <MoreHorizontal className="size-5 shrink-0" />
            Më shumë
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop className="bg-abyss/70 fixed inset-0 z-50 md:hidden" />
            <DialogPrimitive.Popup className="border-moss bg-abyss fixed inset-x-0 bottom-0 z-50 border-t-2 pb-[env(safe-area-inset-bottom,0px)] md:hidden">
              <div className="border-summit/[0.06] flex items-center justify-between border-b px-4 py-3">
                <DialogPrimitive.Title className="text-summit text-[11px] font-bold tracking-[0.1em] uppercase">
                  Më shumë
                </DialogPrimitive.Title>
                <DialogPrimitive.Close
                  aria-label="Mbyll"
                  className="text-summit/60 hover:text-summit -mr-1 p-1"
                >
                  <X className="size-4" />
                </DialogPrimitive.Close>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setMoreOpen(false)}
                className="border-summit/[0.06] flex items-center gap-3 border-b px-4 py-3"
              >
                <UserAvatar name={userName} src={avatarUrl} />
                <span className="text-summit truncate text-[11px] font-bold tracking-[0.08em] uppercase">
                  {userName}
                </span>
              </Link>
              <ul className="py-1">
                {more.map((item) => {
                  const active = isActive(pathname, currentTab, item);
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex items-center gap-3 border-l-4 px-4 py-3.5 text-[11px] font-bold tracking-[0.08em] uppercase",
                          active
                            ? "border-moss bg-moss/10 text-moss"
                            : "text-summit/70 hover:bg-summit/[0.04] border-transparent",
                        )}
                      >
                        <item.icon className="size-[18px] shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      ) : null}
    </nav>
  );
}
