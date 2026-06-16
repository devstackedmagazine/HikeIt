"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export interface NavLink {
  href: string;
  label: string;
}

/** Hamburger menu for small screens: toggles a panel of nav links + auth CTAs. */
export function MobileNav({
  links,
  isLoggedIn,
}: {
  links: NavLink[];
  isLoggedIn: boolean;
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
        <div className="absolute inset-x-0 top-full border-b bg-background shadow-lg">
          <nav className="flex flex-col gap-1 px-4 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t pt-4">
              {isLoggedIn ? (
                <Button render={<Link href="/dashboard" />} className="w-full">
                  Shko te paneli
                </Button>
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
