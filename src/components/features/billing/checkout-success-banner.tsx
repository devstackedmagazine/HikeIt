"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** How often to re-check the DB while the webhook is landing. */
const POLL_INTERVAL_MS = 3000;

/** Stop polling after this long and tell the club to come back. */
const POLL_TIMEOUT_MS = 90_000;

/**
 * Shown after the Paddle overlay redirects back with `?checkout=success`.
 *
 * The redirect proves the club finished the overlay, **not** that the
 * subscription exists — `subscription.created` arrives separately and may be
 * seconds behind. So this never announces a plan on the strength of the URL:
 * while the server still reports the club as unsubscribed it says "activating"
 * and polls, and only the webhook flips it. `isActive` is resolved
 * server-side from the club row, so it can only become true once the
 * subscription is genuinely recorded.
 *
 * If the webhook never lands, the banner stops polling rather than spinning
 * forever, and says plainly that the payment went through — a club that has
 * been charged must never be told nothing happened.
 */
export function CheckoutSuccessBanner({ isActive }: { isActive: boolean }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isActive) return;

    const poll = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    const stop = setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);

    return () => {
      clearInterval(poll);
      clearTimeout(stop);
    };
  }, [isActive, router]);

  if (isActive) {
    return (
      <div className="border-moss/40 bg-moss/10 flex items-start gap-2.5 border-2 px-4 py-3.5">
        <CheckCircle2 className="text-moss mt-0.5 size-4 shrink-0" />
        <div>
          <p className="text-moss text-[11px] font-bold tracking-[0.08em] uppercase">
            Abonimi u aktivizua
          </p>
          <p className="text-summit/50 mt-1 text-[12px] leading-relaxed">
            Faleminderit! Veçoritë e klubit janë tani aktive.
          </p>
        </div>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="border-alert/40 bg-alert/10 flex items-start gap-2.5 border-2 px-4 py-3.5">
        <CheckCircle2 className="text-alert mt-0.5 size-4 shrink-0" />
        <div>
          <p className="text-alert text-[11px] font-bold tracking-[0.08em] uppercase">
            Pagesa u krye
          </p>
          <p className="text-summit/50 mt-1 text-[12px] leading-relaxed">
            Aktivizimi po zgjat më shumë se zakonisht. Rifreskoni faqen pas pak
            — nëse abonimi nuk shfaqet, na shkruani në hello@hikeit.app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-summit/20 bg-summit/[0.04] flex items-start gap-2.5 border-2 px-4 py-3.5">
      <Loader2 className="text-summit/50 mt-0.5 size-4 shrink-0 animate-spin" />
      <div>
        <p className="text-summit/70 text-[11px] font-bold tracking-[0.08em] uppercase">
          Po aktivizohet abonimi…
        </p>
        <p className="text-summit/45 mt-1 text-[12px] leading-relaxed">
          Pagesa u pranua. Aktivizimi konfirmohet automatikisht brenda pak
          sekondash.
        </p>
      </div>
    </div>
  );
}
