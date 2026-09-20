import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

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

export default async function BillingPage() {
  const user = await getRequiredUser();
  const club = await getUserAdminClub(user.id);

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

      {/* Current plan */}
      <div className="border-summit/10 bg-summit/[0.04] border px-5 py-4">
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
          <p className="text-summit/30 border-summit/10 mt-4 border-t pt-3 text-[11px] leading-relaxed">
            Për ndryshime në abonim (faturat, metoda e pagesës, anulimi), na
            shkruani: hello@hikeit.app.
          </p>
        ) : null}
      </div>

      {/* Abonimet nuk janë hapur ende — shfaqet gjithmonë përveç rastit kur
          klubi është tashmë abonuar (p.sh. para këtij ndryshimi). */}
      {!isSubscribed ? (
        <div>
          <AccentHeader>
            {entitlement.source === "trial" ? "Pas Provës" : "Abonimet"}
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

          <div className="border-summit/10 bg-summit/[0.04] border px-5 py-4">
            <p className="text-summit/60 text-[12px] leading-relaxed">
              Abonimet Pro dhe Team hapen për klubet së shpejti. Deri atëherë
              çdo klub përdor platformën falas gjatë provës. Shiko planet dhe
              çmimet te{" "}
              <Link
                href="/pricing"
                className="text-moss hover:text-moss/80 underline underline-offset-2"
              >
                faqja e çmimeve
              </Link>
              , ose na shkruani direkt.
            </p>
            <Link
              href="mailto:hello@hikeit.app"
              className="border-summit/40 text-summit hover:bg-summit hover:text-abyss mt-4 inline-block border-2 px-5 py-3 text-[11px] font-extrabold tracking-[0.06em] uppercase transition-colors"
            >
              Na Shkruani — hello@hikeit.app
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
