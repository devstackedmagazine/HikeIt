"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

export interface MarketingNavItem {
  href: string;
  label: string;
}

/**
 * Centered primary navigation for the marketing chrome. Highlights the active
 * section in Moss; inactive links sit at reduced opacity per the design.
 */
export function MarketingNav({ items }: { items: MarketingNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-8 md:flex">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-[13px] font-medium tracking-[0.05em] uppercase transition-colors",
              isActive
                ? "text-moss"
                : "text-summit/60 hover:text-summit",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
