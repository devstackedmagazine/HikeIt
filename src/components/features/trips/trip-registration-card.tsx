"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";
import {
  cancelMyRegistration,
  registerForTrip,
} from "@/server/actions/trip-registrations";

import { StripeRedirectOverlay } from "./stripe-redirect-overlay";

/** How often we re-check the DB while a payment is confirming. */
const POLL_INTERVAL_MS = 3000;

const PLATFORM_FEE_RATE = 0.025;
const STRIPE_PCT = 0.014;
const STRIPE_FIXED = 0.25;

export interface TripRegistrationCardProps {
  tripId: string;
  slug: string;
  isLoggedIn: boolean;
  isPast: boolean;
  priceEur: string;
  confirmedCount: number;
  maxParticipants: number | null;
  registration: { id: string; status: string; paymentStatus: string } | null;
  /** True when Stripe Checkout redirected back with `?payment=success` —
   * purely informational. The webhook, not this flag, confirms payment; if
   * the DB still shows `pending` we tell the hiker it's processing, never
   * that they're registered. */
  returnedFromCheckout?: boolean;
}

export function TripRegistrationCard({
  tripId,
  slug,
  isLoggedIn,
  isPast,
  priceEur,
  confirmedCount,
  maxParticipants,
  registration,
  returnedFromCheckout = false,
}: TripRegistrationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const price = Number(priceEur);
  const free = price === 0;
  // Only "confirmed"/"waitlisted" count as registered — a "pending" row means
  // payment hasn't been confirmed by the webhook yet, and must never render
  // as success regardless of what the client thinks happened at Checkout.
  const isRegistered =
    registration !== null &&
    (registration.status === "confirmed" ||
      registration.status === "waitlisted");
  const isPaymentProcessing =
    registration !== null &&
    registration.status === "pending" &&
    registration.paymentStatus === "pending";
  const isFull = maxParticipants !== null && confirmedCount >= maxParticipants;
  const remaining =
    maxParticipants !== null
      ? Math.max(0, maxParticipants - confirmedCount)
      : null;
  const pct =
    maxParticipants && maxParticipants > 0
      ? Math.min(100, Math.round((confirmedCount / maxParticipants) * 100))
      : 0;

  // Rough hiker-facing breakdown of who takes what from the price.
  const platformFee = price * PLATFORM_FEE_RATE;
  const stripeFee = price * STRIPE_PCT + STRIPE_FIXED;

  // While a payment is confirming, poll the DB every few seconds so the card
  // flips to "REGJISTRUAR ✓" the moment the webhook lands — no manual refresh,
  // no waiting on a club approval step (payment = registered, Option A).
  useEffect(() => {
    if (!isPaymentProcessing) return;
    const id = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPaymentProcessing, router]);

  async function register() {
    setLoading(true);
    setError(null);
    const result = await registerForTrip(tripId);
    if (!result.success) {
      setLoading(false);
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    // Paid trips: full-page, top-level redirect to Stripe's hosted Checkout.
    // Swap the whole page for the branded transition overlay first so the
    // handoff feels intentional. The registration stays "pending" until the
    // webhook confirms payment — never mark it confirmed from the client.
    if (result.type === "paid" && result.checkoutUrl) {
      setRedirecting(true);
      window.location.href = result.checkoutUrl;
      return;
    }
    // Free trips are confirmed immediately.
    setLoading(false);
    router.refresh();
  }

  async function cancel() {
    if (!registration) return;
    setLoading(true);
    setError(null);
    const result = await cancelMyRegistration(registration.id);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    router.refresh();
  }

  const buttonClass =
    "flex w-full items-center justify-center gap-2 border py-3.5 font-heading text-[14px] font-extrabold tracking-[0.04em] uppercase transition-colors";
  const primaryClass =
    "border-moss/50 bg-moss/20 text-moss hover:border-moss/70 hover:bg-moss/30";

  if (redirecting) return <StripeRedirectOverlay />;

  return (
    <div className="border border-summit/12 bg-summit/[0.03] p-[18px]">
      <p className="mb-1 text-[9px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
        Çmimi per person
      </p>
      <p className="font-heading mb-3.5 text-[36px] leading-none font-extrabold tracking-[-0.03em] text-summit">
        {free ? (
          <span className="text-moss uppercase">Falas</span>
        ) : (
          `€${price}`
        )}
      </p>

      {maxParticipants !== null ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.04em] text-summit/45 uppercase">
              {remaining}/{maxParticipants} Vende të mbetura
            </span>
            <span className="text-[10px] font-bold text-summit/35">{pct}%</span>
          </div>
          <div className="my-2 h-1 w-full bg-summit/[0.08]">
            <div className="h-full bg-moss" style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : null}

      {/* Fee breakdown for paid trips (not while paying). */}
      {!free && !isRegistered && !isPast ? (
        <p className="mt-2 text-[9px] leading-relaxed tracking-[0.02em] text-summit/25 uppercase">
          Stripe merr ~€{stripeFee.toFixed(2)} · HikeIt €
          {platformFee.toFixed(2)} (2.5%)
        </p>
      ) : null}

      <div className="mt-4">
        {isPast ? (
          <span className={cn(buttonClass, "border-summit/15 text-summit/35")}>
            Përfundoi
          </span>
        ) : !isLoggedIn ? (
          <Link
            href={`/login?redirect=/trips/${slug}`}
            className={cn(buttonClass, primaryClass)}
          >
            {free ? "Regjistrohu falas →" : `Regjistrohu — €${price}`}
          </Link>
        ) : isRegistered ? (
          <div className="space-y-2">
            <span className="flex items-center justify-center gap-2 border border-moss/40 bg-moss/15 py-3 text-[13px] font-bold text-moss uppercase">
              <CheckCircle2 className="size-4" />
              {registration?.status === "waitlisted"
                ? "Në listën e pritjes"
                : "Regjistruar ✓"}
            </span>
            <button
              type="button"
              onClick={cancel}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 border border-summit/15 py-2.5 text-[10px] font-bold tracking-[0.08em] text-summit/45 uppercase transition-colors hover:text-summit disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Anulo regjistrimin
            </button>
            {!free ? (
              <p className="text-center text-[9px] leading-relaxed tracking-[0.02em] text-summit/30 uppercase">
                Rimbursim i plotë nëse anulohet 24 orë para nisjes.
              </p>
            ) : null}
          </div>
        ) : isPaymentProcessing ? (
          <div className="space-y-2">
            <span className="flex items-center justify-center gap-2 border border-moss/40 bg-moss/15 py-3 text-[12px] font-bold text-moss uppercase">
              <Loader2 className="size-4 animate-spin" />
              Pagesa po konfirmohet…
            </span>
            <p className="text-center text-[10px] tracking-[0.02em] text-summit/35 uppercase">
              {returnedFromCheckout
                ? "U kthyet nga Stripe — konfirmohet automatikisht."
                : "Do të konfirmohet automatikisht."}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={register}
            disabled={loading}
            className={cn(buttonClass, primaryClass, "disabled:opacity-50")}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {isFull
              ? "Lista e pritjes →"
              : free
                ? "Regjistrohu falas →"
                : `Regjistrohu — €${price}`}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-2 text-[11px] text-danger" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-2.5 text-center text-[10px] tracking-[0.04em] text-summit/25 uppercase">
          Anulimi falas deri 24 ore para nisjes.
        </p>
      )}
    </div>
  );
}
