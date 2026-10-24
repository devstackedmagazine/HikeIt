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
      <h1 className="font-heading text-2xl font-black uppercase">
        Ndodhi një gabim
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Nuk arritëm ta ngarkojmë këtë faqe. Provo përsëri.
      </p>
      <Button className="mt-6" onClick={reset}>
        Provo Përsëri
      </Button>
    </div>
  );
}
