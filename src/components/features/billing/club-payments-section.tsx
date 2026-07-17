"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { StripeAccountStatus } from "@/lib/stripe/connect-status";
import {
  createOnboardingLink,
  getConnectAccountStatus,
} from "@/server/actions/stripe-connect";

const STRIPE_DASHBOARD_URL = "https://dashboard.stripe.com";

export function ClubPaymentsSection({
  organizationId,
  status: initialStatus,
}: {
  organizationId: string;
  status: StripeAccountStatus;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<StripeAccountStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const refreshed = useRef(false);

  // On return from Stripe onboarding (?stripe=success), re-sync the account
  // status from Stripe and show a confirmation. Runs once.
  useEffect(() => {
    if (params.get("stripe") !== "success" || refreshed.current) return;
    refreshed.current = true;
    void (async () => {
      const result = await getConnectAccountStatus(organizationId);
      if (result.status) setStatus(result.status);
      if (result.status === "active") setShowSuccess(true);
      router.refresh();
    })();
  }, [params, organizationId, router]);

  async function startOnboarding() {
    setLoading(true);
    setError(null);
    const result = await createOnboardingLink(organizationId);
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    setLoading(false);
    setError(result.error ?? "Diçka shkoi keq.");
  }

  return (
    <div className="border-2 border-forest bg-summit">
      <div className="border-b-2 border-forest p-5">
        <h3 className="font-heading text-lg font-black tracking-tight text-forest uppercase">
          Pagesat Online
        </h3>
      </div>
      <div className="space-y-4 p-5">
        {showSuccess ? (
          <div className="flex items-center gap-2 border-2 border-moss bg-moss/10 px-3.5 py-3">
            <CheckCircle2 className="size-4 shrink-0 text-moss" />
            <p className="text-[13px] font-bold tracking-[0.04em] text-forest uppercase">
              Stripe u aktivizua me sukses!
            </p>
          </div>
        ) : null}

        {status === "active" ? (
          <ActiveState />
        ) : status === "restricted" ? (
          <RestrictedState onFix={startOnboarding} loading={loading} />
        ) : status === "pending" ? (
          <PendingState onContinue={startOnboarding} loading={loading} />
        ) : (
          <NotConnectedState onConnect={startOnboarding} loading={loading} />
        )}

        {error ? (
          <p className="text-[13px] font-medium text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** State A — not connected. */
function NotConnectedState({
  onConnect,
  loading,
}: {
  onConnect: () => void;
  loading: boolean;
}) {
  return (
    <>
      <StatusLabel tone="danger">Stripe nuk është lidhur</StatusLabel>
      <p className="text-[13px] leading-relaxed text-forest/70">
        Lidhni llogarinë tuaj Stripe për të mbledhur pagesa nga turistët.
      </p>
      <ConnectButton onClick={onConnect} loading={loading}>
        Lidhu me Stripe
      </ConnectButton>
    </>
  );
}

/** State B — onboarding started, not complete. */
function PendingState({
  onContinue,
  loading,
}: {
  onContinue: () => void;
  loading: boolean;
}) {
  return (
    <>
      <StatusLabel tone="alert">Stripe në pritje</StatusLabel>
      <p className="text-[13px] leading-relaxed text-forest/70">
        Plotësoni konfigurimin e Stripe për të aktivizuar pagesat.
      </p>
      <ConnectButton onClick={onContinue} loading={loading}>
        Vazhdo Konfigurimin
      </ConnectButton>
    </>
  );
}

/** State C — active. */
function ActiveState() {
  return (
    <>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-5 shrink-0 text-moss" />
        <StatusLabel tone="moss">Stripe aktiv</StatusLabel>
      </div>
      <p className="text-[13px] leading-relaxed text-forest/70">
        Komisioni i platformës: <strong>2.5%</strong> për çdo pagesë. Paratë
        shkojnë drejtpërdrejt në llogarinë tuaj Stripe.
      </p>
      <a
        href={STRIPE_DASHBOARD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[13px] font-bold tracking-[0.04em] text-forest uppercase underline-offset-4 hover:underline"
      >
        Paneli i Stripe
        <ExternalLink className="size-3.5" />
      </a>
    </>
  );
}

/** State D — restricted. */
function RestrictedState({
  onFix,
  loading,
}: {
  onFix: () => void;
  loading: boolean;
}) {
  return (
    <>
      <StatusLabel tone="danger">Stripe i kufizuar</StatusLabel>
      <p className="text-[13px] leading-relaxed text-forest/70">
        Stripe ka kufizuar llogarinë tuaj. Plotësoni informacionin e kërkuar për
        të vazhduar pagesat.
      </p>
      <ConnectButton onClick={onFix} loading={loading}>
        Zgjidh Problemin
      </ConnectButton>
    </>
  );
}

function StatusLabel({
  tone,
  children,
}: {
  tone: "danger" | "alert" | "moss";
  children: string;
}) {
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "alert"
        ? "text-alert"
        : "text-moss";
  return (
    <p
      className={`text-xs font-bold tracking-[0.1em] uppercase ${color} ${
        tone === "alert" ? "flex items-center gap-1.5" : ""
      }`}
    >
      {tone === "alert" ? <AlertTriangle className="size-3.5" /> : null}
      {children}
    </p>
  );
}

function ConnectButton({
  onClick,
  loading,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-forest px-6 py-3 text-[13px] font-bold tracking-[0.06em] text-summit uppercase transition-colors hover:bg-pine disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
