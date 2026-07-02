"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";
import {
  cancelMyRegistration,
  registerForTrip,
} from "@/server/actions/trip-registrations";

export interface TripRegistrationCardProps {
  tripId: string;
  slug: string;
  isLoggedIn: boolean;
  isPast: boolean;
  priceEur: string;
  confirmedCount: number;
  maxParticipants: number | null;
  registration: { id: string; status: string } | null;
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
}: TripRegistrationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const free = Number(priceEur) === 0;
  const isRegistered =
    registration !== null && registration.status !== "canceled";
  const isFull =
    maxParticipants !== null && confirmedCount >= maxParticipants;
  const remaining =
    maxParticipants !== null ? Math.max(0, maxParticipants - confirmedCount) : null;
  const pct =
    maxParticipants && maxParticipants > 0
      ? Math.min(100, Math.round((confirmedCount / maxParticipants) * 100))
      : 0;

  async function register() {
    setLoading(true);
    setError(null);
    const result = await registerForTrip(tripId);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    router.refresh();
  }

  async function cancel() {
    if (!registration) return;
    setLoading(true);
    await cancelMyRegistration(registration.id);
    setLoading(false);
    router.refresh();
  }

  const buttonClass =
    "flex w-full items-center justify-center gap-2 border py-3.5 font-heading text-[14px] font-extrabold tracking-[0.04em] uppercase transition-colors";
  const primaryClass =
    "border-moss/50 bg-moss/20 text-moss hover:border-moss/70 hover:bg-moss/30";

  return (
    <div className="border border-summit/12 bg-summit/[0.03] p-[18px]">
      <p className="mb-1 text-[9px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
        Çmimi per person
      </p>
      <p className="font-heading mb-3.5 text-[36px] leading-none font-extrabold tracking-[-0.03em] text-summit">
        {free ? (
          <span className="text-moss uppercase">Falas</span>
        ) : (
          `€${Number(priceEur)}`
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
            Regjistrohu →
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
          </div>
        ) : (
          <button
            type="button"
            onClick={register}
            disabled={loading}
            className={cn(buttonClass, primaryClass, "disabled:opacity-50")}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {isFull ? "Lista e pritjes →" : "Regjistrohu →"}
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
