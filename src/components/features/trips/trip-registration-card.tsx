"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
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
  const [acceptedWaiver, setAcceptedWaiver] = useState(false);

  const price = Number(priceEur);
  const free = price === 0;
  const isRegistered =
    registration !== null &&
    (registration.status === "confirmed" ||
      registration.status === "waitlisted");
  const isFull = maxParticipants !== null && confirmedCount >= maxParticipants;
  const remaining =
    maxParticipants !== null
      ? Math.max(0, maxParticipants - confirmedCount)
      : null;
  const pct =
    maxParticipants && maxParticipants > 0
      ? Math.min(100, Math.round((confirmedCount / maxParticipants) * 100))
      : 0;

  async function register() {
    setLoading(true);
    setError(null);
    const result = await registerForTrip(tripId, acceptedWaiver);
    if (!result.success) {
      setLoading(false);
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
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

  return (
    <div className="border-summit/12 bg-summit/[0.03] min-w-0 border p-4 sm:p-[18px]">
      <p className="text-summit/30 mb-1 text-[9px] font-semibold tracking-[0.12em] uppercase">
        Çmimi per person
      </p>
      <p className="font-heading text-summit mb-3.5 text-[36px] leading-none font-extrabold tracking-[-0.03em]">
        {free ? (
          <span className="text-moss uppercase">Falas</span>
        ) : (
          `€${price}`
        )}
      </p>

      {maxParticipants !== null ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-summit/45 text-[10px] font-semibold tracking-[0.04em] uppercase">
              {remaining}/{maxParticipants} Vende të mbetura
            </span>
            <span className="text-summit/35 text-[10px] font-bold">{pct}%</span>
          </div>
          <div className="bg-summit/[0.08] my-2 h-1 w-full">
            <div className="bg-moss h-full" style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : null}

      {/* HikeIt does not process trip money — say so plainly, so nobody
          expects to be charged here and nobody forgets to pay the club. */}
      {!free && !isPast ? (
        <p className="text-summit/25 mt-2 text-[9px] leading-relaxed tracking-[0.02em] break-words uppercase">
          Pagesa bëhet direkt te klubi
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
            {free ? "Regjistrohu falas →" : "Regjistrohu →"}
          </Link>
        ) : isRegistered ? (
          <div className="space-y-2">
            <span className="border-moss/40 bg-moss/15 text-moss flex items-center justify-center gap-2 border py-3 text-[13px] font-bold uppercase">
              <CheckCircle2 className="size-4" />
              {registration?.status === "waitlisted"
                ? "Në listën e pritjes"
                : "Regjistruar ✓"}
            </span>
            <CancelConfirmDialog
              isPaid={!free}
              loading={loading}
              onConfirm={cancel}
            />
            {!free ? (
              <p className="text-summit/30 text-center text-[9px] leading-relaxed tracking-[0.02em] uppercase">
                Çmimin e arkëton klubi direkt.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Liability waiver — required before registering. Also enforced
                server-side; the acceptance time is stored on the registration. */}
            <label className="flex cursor-pointer gap-2.5 text-left">
              <input
                type="checkbox"
                checked={acceptedWaiver}
                onChange={(e) => setAcceptedWaiver(e.target.checked)}
                className="border-summit/40 checked:border-moss checked:bg-moss focus-visible:outline-moss mt-0.5 size-4 shrink-0 appearance-none border-2 bg-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              />
              <span className="text-summit/45 text-[10px] leading-[1.5]">
                Kuptoj që hiking ka rreziqe të qenësishme. Lexova dhe pranoj{" "}
                <Link
                  href="/terms"
                  className="text-moss hover:text-summit font-bold underline underline-offset-2"
                >
                  Kushtet e Shërbimit
                </Link>{" "}
                dhe{" "}
                <Link
                  href="/privacy"
                  className="text-moss hover:text-summit font-bold underline underline-offset-2"
                >
                  Politikën e Privatësisë
                </Link>
                .
              </span>
            </label>
            <button
              type="button"
              onClick={register}
              disabled={loading || !acceptedWaiver}
              className={cn(buttonClass, primaryClass, "disabled:opacity-50")}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {isFull
                ? "Lista e pritjes →"
                : free
                  ? "Regjistrohu falas →"
                  : "Regjistrohu →"}
            </button>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-danger mt-2 text-[11px]" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-summit/25 mt-2.5 text-center text-[10px] tracking-[0.04em] uppercase">
          Mund ta anuloni në çdo kohë para nisjes.
        </p>
      )}
    </div>
  );
}

/**
 * Alpine Brutalism confirmation dialog for the hiker's own cancellation:
 * Abyss background, Summit text, 2px Forest borders, zero border radius.
 * Danger button confirms ("ANULO REGJISTRIMIN"), Forest button ("KTHEHU")
 * backs out. Built directly on the base-ui alert-dialog, same pattern as the
 * club admin's removal dialog.
 */
function CancelConfirmDialog({
  isPaid,
  loading,
  onConfirm,
}: {
  isPaid: boolean;
  loading: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  async function confirm() {
    await onConfirm();
    setOpen(false);
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        render={
          <button
            type="button"
            disabled={loading}
            className="border-summit/40 text-summit/45 hover:text-summit flex w-full items-center justify-center gap-2 border py-2.5 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors disabled:opacity-50"
          />
        }
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Anulo regjistrimin
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="bg-abyss/70 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50" />
        <AlertDialog.Popup className="border-forest bg-abyss text-summit fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 border-2 p-6 outline-none sm:max-w-md">
          <AlertDialog.Title className="font-heading text-summit text-[16px] font-extrabold tracking-[0.04em] uppercase">
            A jeni i sigurt?
          </AlertDialog.Title>
          <AlertDialog.Description className="text-summit/70 mt-3 space-y-2 text-[13px] leading-relaxed">
            <p>
              Vendi juaj lirohet dhe mund t&apos;i kalojë dikujt nga lista e
              pritjes.
            </p>
            {isPaid ? (
              <p>
                Nëse i keni paguar tashmë klubit, rimbursimi merret vesh
                direkt me ta.
              </p>
            ) : null}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Close
              render={
                <button
                  type="button"
                  disabled={loading}
                  className="border-forest font-heading text-summit hover:bg-forest border-2 bg-transparent px-4 py-2 text-[12px] font-bold tracking-[0.04em] uppercase transition-colors disabled:opacity-50"
                />
              }
            >
              Kthehu
            </AlertDialog.Close>
            <button
              type="button"
              onClick={confirm}
              disabled={loading}
              className="border-danger bg-danger font-heading text-summit flex items-center gap-2 border-2 px-4 py-2 text-[12px] font-bold tracking-[0.04em] uppercase transition-colors hover:border-red-900 hover:bg-red-900 disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Anulo regjistrimin
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
