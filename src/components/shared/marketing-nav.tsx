"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

export interface MarketingNavItem {
  href: string;
  label: string;
}

/**
 * Centered primary navigation for the marketing chrome. The active section is a
 * solid Moss block with Abyss text — the same resting state the dashboard
 * sidebar uses — so "where am I" reads identically across both shells.
 */
export function MarketingNav({ items }: { items: MarketingNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-2 md:flex">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "px-3.5 py-2 text-[13px] tracking-[0.05em] uppercase transition-colors",
              isActive
                ? "bg-moss text-abyss font-bold"
                : "text-summit/60 hover:bg-summit/[0.06] hover:text-summit font-medium",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
