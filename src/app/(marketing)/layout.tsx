import { Mountain } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Brand } from "@/components/shared/brand";
import { MobileNav, type NavLink } from "@/components/shared/mobile-nav";
import { Button } from "@/components/ui/button";
import { getOptionalSession } from "@/lib/auth/helpers";

const NAV_LINKS: NavLink[] = [
  { href: "/trails", label: "Shtigje" },
  { href: "/clubs", label: "Klube" },
  { href: "/trips", label: "Udhëtime" },
  { href: "/pricing", label: "Çmimet" },
];

const FOOTER_COLUMNS: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Produkti",
    links: [
      { href: "/trails", label: "Shtigje" },
      { href: "/clubs", label: "Klube" },
      { href: "/trips", label: "Udhëtime" },
      { href: "/pricing", label: "Çmimet" },
    ],
  },
  {
    heading: "Kompania",
    links: [
      { href: "/about", label: "Rreth nesh" },
      { href: "mailto:hello@hikeit.app", label: "Kontakt" },
      { href: "#", label: "Blog" },
    ],
  },
  {
    heading: "Ligjore",
    links: [
      { href: "#", label: "Privatësia" },
      { href: "#", label: "Kushtet" },
    ],
  },
];

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getOptionalSession();
  const isLoggedIn = !!session;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <Button render={<Link href="/dashboard" />}>Shko te paneli</Button>
            ) : (
              <>
                <Button variant="ghost" render={<Link href="/login" />}>
                  Hyr
                </Button>
                <Button render={<Link href="/register" />}>Fillo sot</Button>
              </>
            )}
          </div>

          <MobileNav links={NAV_LINKS} isLoggedIn={isLoggedIn} />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <Brand asLink={false} />
              <p className="text-sm text-muted-foreground">
                Komuniteti yt malor
              </p>
            </div>
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading}>
                <h3 className="mb-3 text-sm font-semibold">{column.heading}</h3>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={`${column.heading}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-2 border-t pt-6 text-sm text-muted-foreground">
            <Mountain className="size-4 text-primary" />
            <span>© 2025 HikeIt. Ndërtuar për Kosovën 🇽🇰</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
