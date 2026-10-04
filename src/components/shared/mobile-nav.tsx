"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

export interface NavLink {
  href: string;
  label: string;
}

/** Hamburger menu for small screens: toggles a panel of nav links + auth CTAs. */
export function MobileNav({
  links,
  isLoggedIn,
  userName = null,
  avatarUrl = null,
}: {
  links: NavLink[];
  isLoggedIn: boolean;
  userName?: string | null;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X /> : <Menu />}
      </Button>

      {open ? (
        <div className="bg-background absolute inset-x-0 top-full border-b shadow-lg">
          <nav className="flex flex-col gap-1 px-4 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-foreground hover:bg-muted rounded-md px-3 py-2 text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t pt-4">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-1"
                  >
                    <UserAvatar name={userName} src={avatarUrl} />
                    <span className="truncate text-sm font-medium">
                      {userName ?? "Profili"}
                    </span>
                  </Link>
                  <Button
                    render={<Link href="/dashboard" />}
                    className="w-full"
                  >
                    Shko te paneli
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    render={<Link href="/login" />}
                    className="w-full"
                  >
                    Hyr
                  </Button>
                  <Button render={<Link href="/register" />} className="w-full">
                    Fillo sot
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
