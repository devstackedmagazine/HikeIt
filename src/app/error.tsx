"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { section: "root" } });
  }, [error]);

  return (
    <main className="bg-muted/30 flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-3xl font-black uppercase">
        Ndodhi një gabim
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Diçka shkoi keq. Provoni përsëri ose kthehuni në faqen kryesore.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="bg-muted text-destructive mt-4 max-w-lg overflow-auto rounded-lg p-4 text-left text-xs">
          {error.message}
        </pre>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Provoni Përsëri</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Faqja Kryesore
        </Button>
      </div>
    </main>
  );
}
