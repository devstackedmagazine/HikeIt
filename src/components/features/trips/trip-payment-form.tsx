"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getStripe } from "@/lib/stripe/client-browser";

/**
 * Alpine Brutalism appearance for Stripe Elements — zero border radius,
 * exact brand hexes, Inter. Applied via the Elements `appearance` API.
 */
const APPEARANCE: StripeElementsOptions["appearance"] = {
  theme: "flat",
  variables: {
    colorPrimary: "#4CAF7D", // Moss
    colorBackground: "#FAFFF9", // Summit
    colorText: "#1A3D2B", // Forest
    colorDanger: "#C0392B", // Danger
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0px", // Alpine Brutalism — sharp corners
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1.5px solid rgba(26,61,43,0.2)",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1.5px solid #4CAF7D",
      boxShadow: "none",
    },
    ".Label": {
      color: "rgba(26,61,43,0.55)",
      fontWeight: "600",
    },
  },
};

/** Outer wrapper: provides the Elements context bound to a client secret. */
export function TripPaymentForm({
  clientSecret,
  priceLabel,
  tripSlug,
  onCancel,
}: {
  clientSecret: string;
  priceLabel: string;
  tripSlug: string;
  onCancel: () => void;
}) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: APPEARANCE,
  };

  return (
    <Elements stripe={getStripe()} options={options}>
      <PaymentInner
        priceLabel={priceLabel}
        tripSlug={tripSlug}
        onCancel={onCancel}
      />
    </Elements>
  );
}

function PaymentInner({
  priceLabel,
  tripSlug,
  onCancel,
}: {
  priceLabel: string;
  tripSlug: string;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // Confirm on-page. `redirect: "if_required"` keeps card payments inline;
    // only methods that require a redirect (rare here) leave the page.
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/trips/${tripSlug}?paid=1`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      // These messages are already localized/user-safe by Stripe.
      setError(stripeError.message ?? "Pagesa dështoi. Provoni sërish.");
      setSubmitting(false);
      return;
    }

    if (
      paymentIntent?.status === "succeeded" ||
      paymentIntent?.status === "processing"
    ) {
      // The webhook confirms the registration server-side; refresh to reflect it.
      router.refresh();
      return;
    }

    setError("Pagesa nuk u kompletua. Provoni sërish.");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="border border-summit/12 bg-summit p-3.5">
        <PaymentElement />
      </div>

      {error ? (
        <p className="text-[11px] text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="font-heading flex w-full items-center justify-center gap-2 bg-moss py-3.5 text-[14px] font-extrabold tracking-[0.06em] text-abyss uppercase transition-colors hover:bg-pine hover:text-summit disabled:opacity-50"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Paguaj {priceLabel}
      </button>

      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="w-full text-center text-[10px] font-bold tracking-[0.08em] text-summit/40 uppercase transition-colors hover:text-summit/70 disabled:opacity-50"
      >
        Anulo
      </button>
    </form>
  );
}
