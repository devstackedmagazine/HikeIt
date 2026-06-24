import Link from "next/link";
import type { ReactNode } from "react";

import {
  MarketingNav,
  type MarketingNavItem,
} from "@/components/shared/marketing-nav";
import { MobileNav, type NavLink } from "@/components/shared/mobile-nav";
import { getOptionalSession } from "@/lib/auth/helpers";

const NAV_LINKS: MarketingNavItem[] = [
  { href: "/trails", label: "Shtigjet" },
  { href: "/clubs", label: "Klubet" },
  { href: "/trips", label: "Udhëtimet" },
  { href: "/pricing", label: "Çmimet" },
];

const FOOTER_COLUMNS: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Produkti",
    links: [
      { href: "/trails", label: "Shtigjet" },
      { href: "/clubs", label: "Klubet" },
      { href: "/trips", label: "Udhëtimet" },
      { href: "/pricing", label: "Çmimet" },
    ],
  },
  {
    heading: "Kompania",
    links: [
      { href: "/about", label: "Rreth Nesh" },
      { href: "#", label: "Karriera" },
      { href: "#", label: "Impact" },
      { href: "#", label: "Partnerët" },
    ],
  },
  {
    heading: "Ligjore",
    links: [
      { href: "/terms", label: "Kushtet" },
      { href: "/privacy", label: "Privatësia" },
      { href: "#", label: "Siguria" },
      { href: "#", label: "Cookies" },
    ],
  },
];

const SOCIAL_LINKS: { href: string; label: string; icon: string }[] = [
  { href: "#", label: "Instagram", icon: "IG" },
  { href: "#", label: "Facebook", icon: "FB" },
  { href: "#", label: "X", icon: "X" },
];

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getOptionalSession();
  const isLoggedIn = !!session;

  return (
    <div className="flex min-h-svh flex-col bg-abyss">
      {/* Navbar — opaque Abyss, sticky (not fixed) so it never overlaps the
          content of inner marketing pages. */}
      <header className="sticky top-0 z-50 h-14 border-b border-summit/10 bg-abyss">
        <div className="flex h-full items-center justify-between px-6 sm:px-8">
          <Link
            href="/"
            className="font-heading text-xl font-extrabold tracking-[-0.01em] text-moss"
          >
            HIKEIT
          </Link>

          <MarketingNav items={NAV_LINKS} />

          <div className="hidden items-center gap-5 md:flex">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="border border-summit/50 px-5 py-2 text-xs font-bold tracking-[0.08em] text-summit uppercase transition-colors hover:border-moss hover:text-moss"
              >
                Paneli →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[13px] font-medium tracking-[0.05em] text-summit/60 uppercase transition-colors hover:text-summit"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="border border-summit/50 px-5 py-2 text-xs font-bold tracking-[0.08em] text-summit uppercase transition-colors hover:border-moss hover:text-moss"
                >
                  Signup
                </Link>
              </>
            )}
          </div>

          <MobileNav links={NAV_LINKS} isLoggedIn={isLoggedIn} />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-abyss px-6 pt-[60px] sm:px-20">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <p className="font-heading text-[22px] font-extrabold tracking-[-0.01em] text-moss">
              HIKEIT
            </p>
            <p className="mt-3.5 max-w-[260px] text-[13px] leading-[1.65] text-summit/45">
              Eksploroni egërsinë. Mbroni malet. Zhvilloni komunitetin.
            </p>
            <div className="mt-6 flex gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center border border-summit/12 bg-summit/[0.06] text-[11px] font-bold text-summit/50 transition-colors hover:border-moss/40 hover:text-moss"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="mb-5 text-[11px] font-bold tracking-[0.12em] text-summit/35 uppercase">
                {column.heading}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-summit/55 transition-colors hover:text-moss"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-summit/[0.08] py-5">
          <span className="text-[11px] font-medium tracking-[0.1em] text-summit/30 uppercase">
            © 2024 HIKEIT. EXPLORE THE WILD.
          </span>
          <Link
            href="/register"
            className="text-[11px] font-bold tracking-[0.1em] text-summit/30 uppercase transition-colors hover:text-moss"
          >
            DREJT MAJAVE →
          </Link>
        </div>
      </footer>
    </div>
  );
}
