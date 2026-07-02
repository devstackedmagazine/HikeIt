import { loadStripe, type Stripe } from "@stripe/stripe-js";

import { env } from "@/config/env";

/** Singleton browser Stripe.js loader (avoids re-loading on each call). */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(
      env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    );
  }
  return stripePromise;
}
