"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { section: "marketing", digest: error.digest },
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Ndodhi një gabim</h1>
      <p className="mt-2 text-muted-foreground">
        Diçka shkoi keq. Provo përsëri ose kthehu në faqen kryesore.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Provo Përsëri</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Faqja Kryesore
        </Button>
      </div>
    </div>
  );
}
