"use client";

import { Check, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { UpgradeButton } from "@/components/features/billing/upgrade-button";
import { cn } from "@/lib/utils/cn";

const FREE_FEATURES = {
  included: [
    "Shfleto shtigjet",
    "Bashkohu udhëtime falas",
    "Profil personal",
    "Alerts moti",
  ],
  excluded: ["Krijo udhëtime", "Menaxho klub"],
};

const PRO_FEATURES = [
  "Anëtarë të pakufizuar",
  "Udhëtime të pakufizuara",
  "Mblidh pagesa",
  "Dashboard analitike",
  "Suport email",
];

const TEAM_FEATURES = [
  "Admin të shumëfishtë",
  "Analitikë e avancuar",
  "Akses API",
  "Suport prioritar",
];

/** Filled square icon (this design system forces border-radius: 0 everywhere,
 * so "circle" icons render as squares — matching the rest of the site). */
function FeatureIcon({ variant }: { variant: "check" | "x" | "plus" }) {
  const Icon = variant === "check" ? Check : variant === "x" ? X : Plus;
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center",
        variant === "check" && "bg-moss text-summit",
        variant === "x" && "bg-summit/15 text-summit/40",
        variant === "plus" && "bg-sunset text-summit",
      )}
    >
      <Icon className="size-2.5" strokeWidth={3} />
    </span>
  );
}

function FeatureItem({
  icon,
  label,
  className,
}: {
  icon: "check" | "x" | "plus";
  label: string;
  className?: string;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <FeatureIcon variant={icon} />
      <span className={cn("text-[13px] font-medium", className)}>{label}</span>
    </li>
  );
}

export function PricingToggle() {
  const [annual, setAnnual] = useState(false);

  const proPrice = annual ? "€190" : "€19";
  const proPeriod = annual ? "/VIT" : "/MUAJ";
  const teamPrice = annual ? "€490" : "€49";
  const teamPeriod = annual ? "/VIT" : "/MUAJ";

  return (
    <div className="bg-abyss px-6 py-16 sm:px-10">
      {/* Toggle — one unit, two halves sharing a border */}
      <div className="mb-12 flex items-center justify-center">
        <div className="inline-flex border border-forest/30 bg-summit">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              "px-7 py-2.75 text-[13px] tracking-[0.06em] uppercase transition-colors",
              !annual
                ? "bg-forest font-bold text-summit"
                : "font-semibold text-forest/45",
            )}
          >
            Mujore
          </button>
          <div className="relative border-l border-forest/20">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-sunset px-1.75 py-0.5 text-[8px] font-extrabold tracking-[0.08em] whitespace-nowrap text-summit uppercase">
              Kurse 2 muaj
            </span>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={cn(
                "px-7 py-2.75 text-[13px] tracking-[0.06em] uppercase transition-colors",
                annual
                  ? "bg-forest font-bold text-summit"
                  : "font-semibold text-forest/45",
              )}
            >
              Vjetore
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_1.2fr_1fr] lg:items-start">
        {/* FREE */}
        <div className="flex flex-col border border-summit/10 bg-summit/[0.04] p-7">
          <p className="text-[11px] font-bold tracking-[0.08em] text-summit/50 uppercase">
            Free
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-heading text-[28px] font-black text-summit">
              €0
            </span>
            <span className="text-[12px] font-medium text-summit/40 uppercase">
              /Përgjithmonë
            </span>
          </div>
          <p className="mt-2 text-[13px] text-summit/50">
            Për hiker individualë
          </p>

          <div className="my-4 border-t border-summit/8" />

          <ul className="flex-1 space-y-3">
            {FREE_FEATURES.included.map((label) => (
              <FeatureItem
                key={label}
                icon="check"
                label={label}
                className="text-summit"
              />
            ))}
            {FREE_FEATURES.excluded.map((label) => (
              <FeatureItem
                key={label}
                icon="x"
                label={label}
                className="text-summit/30"
              />
            ))}
          </ul>

          <Link
            href="/register"
            className="mt-6 block border border-summit/25 py-[13px] text-center text-[12px] font-bold tracking-[0.08em] text-summit/60 uppercase transition-colors hover:border-summit/40 hover:text-summit/80"
          >
            Fillo Falas
          </Link>
        </div>

        {/* PRO — featured, light card on dark page */}
        <div className="relative z-10 -my-4 flex flex-col border-2 border-moss bg-summit px-7 py-9">
          <span className="absolute -top-[14px] left-1/2 -translate-x-1/2 bg-moss px-3 py-2 text-[10px] font-extrabold tracking-[0.1em] whitespace-nowrap text-white uppercase">
            Më Popullor
          </span>

          <p className="text-[11px] font-bold tracking-[0.08em] text-forest uppercase">
            Pro
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-heading text-[28px] font-black text-forest">
              {proPrice}
            </span>
            <span className="text-[12px] font-medium text-forest/50 uppercase">
              {proPeriod}
            </span>
          </div>
          <p className="mt-2 text-[13px] text-forest/55">
            {annual ? "2 muaj falas përfshirë" : "Për klube alpinizmi"}
          </p>

          <div className="my-4 border-t border-forest/10" />

          <ul className="flex-1 space-y-3">
            {PRO_FEATURES.map((label) => (
              <FeatureItem
                key={label}
                icon="check"
                label={label}
                className="text-forest"
              />
            ))}
          </ul>

          <UpgradeButton
            tier="pro"
            interval={annual ? "yearly" : "monthly"}
            label="Fillo Provën 14-Ditore →"
            variant="moss"
            className="mt-6"
            buttonClassName="h-auto py-3.5 text-[12px] font-extrabold tracking-[0.06em]"
          />
        </div>

        {/* TEAM */}
        <div className="flex flex-col border-2 border-sunset bg-summit/[0.04] p-7">
          <p className="text-[11px] font-bold tracking-[0.08em] text-summit/50 uppercase">
            Team
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-heading text-[28px] font-black text-summit">
              {teamPrice}
            </span>
            <span className="text-[12px] font-medium text-summit/40 uppercase">
              {teamPeriod}
            </span>
          </div>
          <p className="mt-2 text-[13px] text-summit/50">
            Për klube të mëdha dhe federata
          </p>

          <div className="my-4 border-t border-summit/8" />

          <p className="mb-2.5 text-[10px] font-bold tracking-[0.1em] text-sunset uppercase">
            Përfshin çdo gjë në Pro plus:
          </p>
          <ul className="flex-1 space-y-3">
            {TEAM_FEATURES.map((label) => (
              <FeatureItem
                key={label}
                icon="plus"
                label={label}
                className="text-summit"
              />
            ))}
          </ul>

          <Link
            href="mailto:hello@hikeit.app"
            className="mt-6 block border-2 border-sunset py-[13px] text-center text-[12px] font-bold tracking-[0.08em] text-sunset uppercase transition-colors hover:bg-sunset/10"
          >
            Kontakto Ne
          </Link>
        </div>
      </div>
    </div>
  );
}
