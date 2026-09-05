import type { ReactNode } from "react";

/**
 * Shared Alpine Brutalism primitives for the legal pages (/terms, /privacy).
 *
 * The marketing layout is Abyss-dark, so these render dark-on-dark: Forest
 * page header, Abyss body, Moss section labels, zero border radius throughout.
 * `LegalCallout` is the loud variant used for the sections a user must not
 * miss (liability, risk, payments) — Alert-bordered rather than quiet body copy.
 */

export function LegalHeader({
  label,
  title,
  lastUpdated,
}: {
  label: string;
  title: string;
  lastUpdated: string;
}) {
  return (
    <header className="border-b-2 border-forest bg-forest px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold tracking-[0.15em] text-moss uppercase">
          {label}
        </p>
        <h1 className="font-heading mt-3 text-[clamp(28px,5vw,44px)] leading-[1.05] font-black tracking-[-0.02em] text-summit uppercase">
          {title}
        </h1>
        <p className="mt-4 text-xs font-bold tracking-[0.15em] text-summit/50 uppercase">
          Përditësuar së fundi: {lastUpdated}
        </p>
      </div>
    </header>
  );
}

/** One numbered top-level section. `id` doubles as the anchor target. */
export function LegalSection({
  id,
  heading,
  children,
}: {
  id?: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      // scroll-mt clears the sticky 64px marketing navbar so an anchored
      // heading (#security, #cookies) isn't hidden underneath it on jump.
      className="scroll-mt-20 border-t-2 border-forest/20 py-8 first:border-t-0 first:pt-0 sm:py-10"
    >
      <h2 className="font-heading text-xl font-black tracking-[-0.01em] text-summit uppercase sm:text-2xl">
        {heading}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-summit/80">
        {children}
      </div>
    </section>
  );
}

/**
 * High-visibility box for legally critical clauses. Alert-bordered so it reads
 * as a warning the user is meant to stop and read, not skim.
 */
export function LegalCallout({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div className="border-2 border-alert bg-alert/10 px-4 py-5 sm:px-6 sm:py-6">
      <p className="text-xs font-bold tracking-[0.15em] text-alert uppercase">
        {heading}
      </p>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-summit/85">
        {children}
      </div>
    </div>
  );
}

/** Bulleted list matching the body copy scale. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-moss" />
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Moss-colored inline link, used for email and cross-page references. */
export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="font-bold text-moss underline underline-offset-4 transition-colors hover:text-summit"
    >
      {children}
    </a>
  );
}
