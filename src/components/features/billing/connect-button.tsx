"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { startConnectOnboarding } from "@/server/actions/stripe-connect";

export function ConnectButton({
  organizationId,
  connected,
}: {
  organizationId: string;
  connected: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await startConnectOnboarding(organizationId);
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
        {loading ? <Loader2 className="animate-spin" /> : null}
        {connected ? "Përditëso pagesat (Stripe)" : "Aktivizo pagesat (Stripe)"}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
