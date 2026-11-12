"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const CONSENT_KEY = "hikeit-cookie-consent";

/**
 * Informational notice, not a consent gate: the site sets only essential
 * cookies (auth session, OAuth state) and Vercel Analytics is cookieless, so
 * there is nothing to opt into. Dismissal is remembered in localStorage.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Reads persisted consent on mount, then reveals the banner if needed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-2xl flex-col gap-3 rounded-xl border bg-background p-4 shadow-lg sm:flex-row sm:items-center">
      <p className="flex-1 text-sm text-muted-foreground">
        HikeIt përdor vetëm cookies të domosdoshme, për t&apos;ju mbajtur të
        kyçur. Nuk përdorim cookies analitike ose reklamash.
      </p>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" render={<Link href="/privacy" />}>
          Mësoni më shumë
        </Button>
        <Button size="sm" onClick={accept}>
          Në rregull
        </Button>
      </div>
    </div>
  );
}
