"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { BillingInterval, PlanTier } from "@/lib/stripe/client";
import { createCheckoutSession } from "@/server/actions/billing";

export function UpgradeButton({
  tier,
  interval,
  label,
  organizationId,
  variant = "default",
  className,
}: {
  tier: PlanTier;
  interval: BillingInterval;
  label: string;
  organizationId?: string;
  variant?: "default" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    // Without an org context (e.g. the public pricing page), send the user to
    // their billing page; middleware bounces anonymous users to login.
    if (!organizationId) {
      router.push("/dashboard/billing");
      return;
    }

    setLoading(true);
    setError(null);
    const origin = window.location.origin;
    const result = await createCheckoutSession({
      organizationId,
      tier,
      interval,
      successUrl: `${origin}/dashboard/billing?success=1`,
      cancelUrl: `${origin}/dashboard/billing?canceled=1`,
    });
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    setLoading(false);
    setError(result.error ?? "Diçka shkoi keq.");
  }

  return (
    <div className={className}>
      <Button
        variant={variant}
        size="lg"
        className="w-full"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" /> : null}
        {label}
      </Button>
      {error ? (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
