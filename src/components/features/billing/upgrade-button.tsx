"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { BillingInterval, PlanTier } from "@/lib/paddle/client";
import { usePaddle } from "@/lib/paddle/use-paddle";
import { cn } from "@/lib/utils/cn";
import { createCheckout } from "@/server/actions/billing";

/**
 * Opens the Paddle overlay checkout.
 *
 * The button asks the server what to open — price, custom data, customer,
 * discount — and passes it to Paddle.js verbatim. It never chooses a price or
 * a discount itself: those come from env and from the club's redeemed invite
 * code, both of which are server-side facts.
 */
export function UpgradeButton({
  tier,
  interval,
  label,
  organizationId,
  variant = "default",
  className,
  buttonClassName,
}: {
  tier: PlanTier;
  interval: BillingInterval;
  label: string;
  organizationId?: string;
  variant?: "default" | "outline" | "moss";
  className?: string;
  buttonClassName?: string;
}) {
  const router = useRouter();
  const loadPaddle = usePaddle();
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

    const result = await createCheckout({ organizationId, tier, interval });
    if (!result.config) {
      setLoading(false);
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }

    const paddle = await loadPaddle();
    if (!paddle) {
      setLoading(false);
      setError("Pagesat nuk janë konfiguruar ende.");
      return;
    }

    const { config } = result;
    paddle.Checkout.open({
      items: [{ priceId: config.priceId, quantity: 1 }],
      customData: config.customData,
      ...(config.discountId ? { discountId: config.discountId } : {}),
      ...(config.customerId
        ? { customer: { id: config.customerId } }
        : config.customerEmail
          ? { customer: { email: config.customerEmail } }
          : {}),
      settings: {
        displayMode: "overlay",
        // Alpine Brutalism runs dark; a light overlay over the dashboard would
        // read as a different product.
        theme: "dark",
        locale: "en",
        // The club lands back on billing, where the page polls for the webhook
        // to land. The tier is never granted from this redirect — only the
        // webhook grants it.
        successUrl: `${window.location.origin}/dashboard/billing?checkout=success`,
      },
    });

    // The overlay owns the flow from here. Re-enable the button so closing it
    // without paying doesn't leave a dead control behind.
    setLoading(false);
  }

  return (
    <div className={className}>
      <Button
        variant={variant}
        size="lg"
        className={cn("w-full", buttonClassName)}
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
