"use client";

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
    // TODO: forward to Sentry once wired.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Ndodhi një gabim</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Diçka shkoi keq. Provo përsëri ose kthehu në faqen kryesore.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-muted p-4 text-left text-xs text-destructive">
          {error.message}
        </pre>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Provo Përsëri</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Faqja Kryesore
        </Button>
      </div>
    </main>
  );
}
