"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createPortalSession } from "@/server/actions/billing";

export function ManageBillingButton({
  organizationId,
}: {
  organizationId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await createPortalSession(organizationId);
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    setLoading(false);
    setError(result.error ?? "Diçka shkoi keq.");
  }

  return (
    <div>
      <Button variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <ExternalLink />}
        Menaxho Faturimin
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
