import Image from "next/image";
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
    <div className="bg-abyss flex min-h-svh flex-col">
      {/* Navbar — opaque Abyss, sticky (not fixed) so it never overlaps the
          content of inner marketing pages. */}
      <header className="border-summit/10 bg-abyss sticky top-0 z-50 h-16 border-b">
        <div className="flex h-full items-center justify-between px-6 sm:px-8">
          <Link
            href="/"
            className="font-heading text-sage flex items-center gap-2 text-xl font-extrabold tracking-[-0.01em]"
          >
            <Image
              src="/logos/Hikeit-pfp.png"
              alt=""
              width={28}
              height={28}
              className="size-7"
            />
            HIKEIT
          </Link>

          <MarketingNav items={NAV_LINKS} />

          <div className="hidden items-center gap-5 md:flex">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="border-summit/50 text-summit hover:border-sage hover:text-sage border px-5 py-2 text-xs font-bold tracking-[0.08em] uppercase transition-colors"
              >
                Paneli →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sage hover:text-summit flex items-center text-[13px] font-bold tracking-[0.08em] uppercase transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-sage text-abyss flex items-center px-6 py-2.5 text-[13px] font-bold tracking-[0.08em] uppercase transition-all hover:opacity-90"
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
            <p className="font-heading text-sage flex items-center gap-2 text-[22px] font-extrabold tracking-[-0.01em]">
              <Image
                src="/logos/Hikeit-pfp.png"
                alt=""
                width={26}
                height={26}
                className="size-6.5"
              />
              HIKEIT
            </p>
            <p className="text-summit/45 mt-3.5 max-w-[260px] text-[13px] leading-[1.65]">
              Eksploroni egërsinë. Mbroni malet. Zhvilloni komunitetin.
            </p>
            <div className="mt-6 flex gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="border-summit/12 bg-summit/[0.06] text-summit/50 hover:border-sage/40 hover:text-sage flex size-9 items-center justify-center border text-[11px] font-bold transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-summit/35 mb-5 text-[11px] font-bold tracking-[0.12em] uppercase">
                {column.heading}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-summit/55 hover:text-sage text-[13px] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-summit/[0.08] mt-12 flex items-center justify-between border-t py-5">
          <span className="text-summit/30 text-[11px] font-medium tracking-[0.1em] uppercase">
            © 2024 HIKEIT. EXPLORE THE WILD.
          </span>
          <Link
            href="/register"
            className="text-summit/30 hover:text-sage text-[11px] font-bold tracking-[0.1em] uppercase transition-colors"
          >
            DREJT MAJAVE →
          </Link>
        </div>
      </footer>
    </div>
  );
}
