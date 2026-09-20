"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

import { createPortalSession } from "@/server/actions/billing";

/**
 * Opens Paddle's customer portal, where cancellation, payment-method updates
 * and invoice history all live.
 *
 * The session is minted per click rather than rendered into the page: Paddle
 * portal sessions are single-use and must not be cached, so a link baked in at
 * render time would be dead by the time anyone clicked it.
 */
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
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="border-summit/40 font-heading text-summit hover:bg-summit hover:text-abyss inline-flex items-center gap-2 border-2 px-5 py-3 text-[12px] font-extrabold tracking-[0.06em] uppercase transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ExternalLink className="size-3.5" />
        )}
        Menaxho faturimin
      </button>
      {error ? (
        <p className="text-danger mt-2 text-[12px]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
