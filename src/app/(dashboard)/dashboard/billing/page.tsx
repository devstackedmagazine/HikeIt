import { Building2, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CheckoutSuccessBanner } from "@/components/features/billing/checkout-success-banner";
import { ManageBillingButton } from "@/components/features/billing/manage-billing-button";
import { UpgradeButton } from "@/components/features/billing/upgrade-button";
import { EmptyState } from "@/components/shared/empty-state";
import { getRequiredUser, getUserAdminClub } from "@/lib/auth/helpers";
import {
  entitlementSourceLabels,
  type EntitlementTier,
  resolveEntitlement,
} from "@/lib/entitlements";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Faturimi" };

const TIER_LABEL: Record<EntitlementTier, string> = {
  free: "Falas",
  pro: "Pro",
  team: "Team",
};

const PRO_FEATURES = [
  "Anëtarë të pakufizuar",
  "Udhëtime të pakufizuara",
  "Dashboard analitike",
  "Suport me email",
];

const TEAM_FEATURES = [
  "Gjithçka nga Pro",
  "Admin të shumëfishtë",
  "Analitikë e avancuar",
  "Suport me përparësi",
];

/**
 * Albanian status labels for Paddle's own vocabulary. Anything unrecognised
 * falls through to the raw string rather than being hidden — an unexplained
 * status is still more use to a club than none.
 */
const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  trialing: "Në provë",
  past_due: "Pagesa e vonuar",
  paused: "I ndalur",
  canceled: "I anuluar",
  canceling: "Anulohet në fund të periudhës",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function AccentHeader({ children }: { children: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="bg-moss h-[18px] w-[3px]" />
      <h2 className="text-summit text-[11px] font-bold tracking-[0.08em] uppercase">
        {children}
      </h2>
    </div>
  );
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-2">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <Check className="text-moss mt-[3px] size-3.5 shrink-0" />
          <span className="text-summit/55 text-[12px] leading-relaxed">
            {f}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** One purchasable plan: features, both intervals, and its two CTAs. */
function PlanCard({
  name,
  monthlyPrice,
  yearlyPrice,
  features,
  organizationId,
  tier,
  highlight,
}: {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  organizationId: string;
  tier: "pro" | "team";
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-2 p-5",
        highlight
          ? "border-moss/50 bg-moss/[0.06]"
          : "border-summit/15 bg-summit/[0.03]",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-summit text-[18px] font-extrabold tracking-[-0.02em] uppercase">
          {name}
        </h3>
        <p className="font-heading text-sunset text-[24px] leading-none font-extrabold">
          {monthlyPrice}
          <span className="text-summit/35 ml-1 text-[9px] font-semibold tracking-[0.08em] uppercase">
            /muaj
          </span>
        </p>
      </div>

      <div className="border-summit/10 my-4 border-t" />

      <FeatureList features={features} />

      <div className="mt-5 space-y-2">
        <UpgradeButton
          organizationId={organizationId}
          tier={tier}
          interval="monthly"
          label={`${name} — ${monthlyPrice}/muaj`}
          variant={highlight ? "moss" : "default"}
          buttonClassName="h-auto rounded-none py-3 text-[11px] font-extrabold tracking-[0.06em]"
        />
        <UpgradeButton
          organizationId={organizationId}
          tier={tier}
          interval="yearly"
          label={`${yearlyPrice}/vit — kurse 2 muaj`}
          variant="outline"
          buttonClassName="h-auto rounded-none py-3 text-[11px] font-extrabold tracking-[0.06em]"
        />
      </div>
    </div>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await getRequiredUser();
  const club = await getUserAdminClub(user.id);
  const { checkout } = await searchParams;

  if (!club) {
    return (
      <div className="space-y-4">
        <p className="text-summit/35 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.08em] uppercase">
          <Link href="/dashboard" className="hover:text-summit/60">
            Dashboard
          </Link>
          <span className="text-summit/20">/</span>
          <span className="text-summit/60">Faturimi</span>
        </p>
        <EmptyState
          icon={Building2}
          title="Ende pa klub"
          description="Krijo klubin tënd për të menaxhuar abonimin."
          action={{ label: "Krijo klubin", href: "/dashboard/club/create" }}
        />
      </div>
    );
  }

  // Resolved, never read off the row: a club inside its trial has Pro access
  // without a subscription, and this page must say so rather than showing
  // "Falas" to someone who can use everything.
  const entitlement = resolveEntitlement(club);
  const isSubscribed = entitlement.source === "subscription";
  const statusKey = club.paddleSubscriptionStatus ?? "";
  const statusLabel = STATUS_LABEL[statusKey] ?? statusKey;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <p className="text-summit/35 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.08em] uppercase">
        <Link href="/dashboard" className="hover:text-summit/60">
          Dashboard
        </Link>
        <span className="text-summit/20">/</span>
        <span className="text-summit/60">Faturimi</span>
      </p>

      {checkout === "success" ? (
        <CheckoutSuccessBanner isActive={isSubscribed} />
      ) : null}

      {/* Current plan */}
      <div className="border-summit/10 bg-summit/[0.04] border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-summit/30 mb-2 text-[9px] font-semibold tracking-[0.12em] uppercase">
              Plani aktual
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading text-summit text-[clamp(22px,3vw,34px)] leading-none font-extrabold tracking-[-0.02em] uppercase">
                {TIER_LABEL[entitlement.tier]}
              </h1>
              <span
                className={cn(
                  "inline-block border px-2.5 py-[3px] text-[9px] font-bold tracking-[0.1em] uppercase",
                  entitlement.source === "free"
                    ? "border-summit/25 text-summit/50"
                    : "border-moss/30 bg-moss/15 text-moss",
                )}
              >
                {entitlementSourceLabels[entitlement.source]}
              </span>
            </div>

            <div className="text-summit/45 mt-2.5 space-y-1 text-[12px]">
              {isSubscribed && statusLabel ? (
                <p>
                  Statusi:{" "}
                  <span className="text-summit/70 font-semibold">
                    {statusLabel}
                  </span>
                </p>
              ) : null}
              {club.subscriptionCurrentPeriodEnd ? (
                <p>
                  Rinovohet më{" "}
                  <span className="text-summit/70 font-semibold">
                    {formatDate(club.subscriptionCurrentPeriodEnd)}
                  </span>
                </p>
              ) : entitlement.source === "trial" && entitlement.endsAt ? (
                <p>
                  Prova mbaron më{" "}
                  <span className="text-summit/70 font-semibold">
                    {formatDate(entitlement.endsAt)}
                  </span>
                </p>
              ) : null}
              {club.inviteCodeUsed ? (
                <p className="text-summit/30 text-[10px] tracking-[0.06em] uppercase">
                  Kod ftese: {club.inviteCodeUsed}
                </p>
              ) : null}
            </div>
          </div>

          {isSubscribed ? (
            <ManageBillingButton organizationId={club.id} />
          ) : null}
        </div>

        {isSubscribed ? (
          <p className="text-summit/30 border-summit/10 mt-4 border-t pt-3 text-[11px] leading-relaxed">
            Faturat, metoda e pagesës dhe anulimi menaxhohen te portali i
            Paddle.
          </p>
        ) : null}
      </div>

      {/* Plans — shown whenever the club isn't already paying, including
          during the trial, so a club can subscribe before it lapses. */}
      {!isSubscribed ? (
        <div>
          <AccentHeader>
            {entitlement.source === "trial" ? "Vazhdo pa kufij" : "Planet"}
          </AccentHeader>

          {entitlement.source === "trial" && entitlement.endsAt ? (
            <p className="text-summit/45 mb-3 text-[12px] leading-relaxed">
              Klubi ka qasje të plotë Pro deri më{" "}
              <span className="text-summit/70 font-semibold">
                {formatDate(entitlement.endsAt)}
              </span>
              . Pas asaj date kalon në planin falas: deri në 3 udhëtime në muaj
              dhe 50 anëtarë.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <PlanCard
              name="Pro"
              monthlyPrice="€19"
              yearlyPrice="€190"
              features={PRO_FEATURES}
              organizationId={club.id}
              tier="pro"
              highlight
            />
            <PlanCard
              name="Team"
              monthlyPrice="€49"
              yearlyPrice="€490"
              features={TEAM_FEATURES}
              organizationId={club.id}
              tier="team"
            />
          </div>

          <p className="text-summit/25 mt-3 text-[10px] leading-relaxed tracking-[0.02em] uppercase">
            Pagesat procesohen nga Paddle. Anulo në çdo kohë.
          </p>
        </div>
      ) : null}
    </div>
  );
}
