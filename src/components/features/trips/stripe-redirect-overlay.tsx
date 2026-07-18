"use client";

import Image from "next/image";

/**
 * Full-screen Alpine Brutalism transition shown the instant we hand off to
 * Stripe Checkout, replacing the whole page so the redirect reads as an
 * intentional, premium step rather than a jarring jump. Rendered as a fixed
 * overlay covering the viewport; the actual navigation is a top-level
 * `window.location.href` set by the caller.
 */
export function StripeRedirectOverlay() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-abyss"
      role="status"
      aria-live="polite"
    >
      <Image
        src="/logos/Hikeit-pfp.png"
        alt="HikeIt"
        width={64}
        height={64}
        priority
        className="size-16"
      />
      <div
        className="size-8 animate-spin border-2 border-moss/25 border-t-moss"
        aria-hidden
      />
      <p className="font-heading text-[15px] font-extrabold tracking-[0.08em] text-moss uppercase">
        Duke ju ridrejtuar te Stripe…
      </p>
    </div>
  );
}
