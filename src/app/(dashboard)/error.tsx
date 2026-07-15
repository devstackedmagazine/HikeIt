"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { section: "dashboard", digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold tracking-tight">Ndodhi një gabim</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Nuk arritëm ta ngarkojmë këtë faqe. Provo përsëri.
      </p>
      <Button className="mt-6" onClick={reset}>
        Provo Përsëri
      </Button>
    </div>
  );
}
