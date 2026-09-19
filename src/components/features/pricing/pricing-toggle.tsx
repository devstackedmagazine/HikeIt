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
    "Njoftime moti",
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
        variant === "check" && "bg-moss text-abyss",
        variant === "x" && "bg-summit/15 text-summit/70",
        variant === "plus" && "bg-sunset text-abyss",
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
        <div className="border-forest/30 bg-summit inline-flex border">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              "px-7 py-2.75 text-[13px] tracking-[0.06em] uppercase transition-colors",
              !annual
                ? "bg-forest text-summit font-bold"
                : "text-forest/70 font-semibold",
            )}
          >
            Mujore
          </button>
          <div className="border-forest/20 relative border-l">
            <span className="bg-sunset text-abyss absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.75 py-0.5 text-[8px] font-extrabold tracking-[0.08em] whitespace-nowrap uppercase">
              Kurse 2 muaj
            </span>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={cn(
                "px-7 py-2.75 text-[13px] tracking-[0.06em] uppercase transition-colors",
                annual
                  ? "bg-forest text-summit font-bold"
                  : "text-forest/70 font-semibold",
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
        <div className="border-summit/10 bg-summit/[0.04] flex flex-col border p-7">
          <p className="text-summit/50 text-[11px] font-bold tracking-[0.08em] uppercase">
            Free
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-heading text-summit text-[28px] font-black">
              €0
            </span>
            <span className="text-summit/60 text-[12px] font-medium uppercase">
              /Përgjithmonë
            </span>
          </div>
          <p className="text-summit/50 mt-2 text-[13px]">
            Për hiker individualë
          </p>

          <div className="border-summit/8 my-4 border-t" />

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
                className="text-summit/55"
              />
            ))}
          </ul>

          <Link
            href="/register"
            className="border-summit/40 text-summit/60 hover:border-summit/60 hover:text-summit/80 mt-6 block border py-[13px] text-center text-[12px] font-bold tracking-[0.08em] uppercase transition-colors"
          >
            Fillo Falas
          </Link>
        </div>

        {/* PRO — featured, light card on dark page */}
        <div className="border-moss bg-summit relative z-10 -my-4 flex flex-col border-2 px-7 py-9">
          <span className="bg-moss text-abyss absolute -top-[14px] left-1/2 -translate-x-1/2 px-3 py-2 text-[10px] font-extrabold tracking-[0.1em] whitespace-nowrap uppercase">
            Më Popullor
          </span>

          <p className="text-forest text-[11px] font-bold tracking-[0.08em] uppercase">
            Pro
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-heading text-forest text-[28px] font-black">
              {proPrice}
            </span>
            <span className="text-forest/70 text-[12px] font-medium uppercase">
              {proPeriod}
            </span>
          </div>
          <p className="text-forest/70 mt-2 text-[13px]">
            {annual ? "2 muaj falas përfshirë" : "Për klube alpinizmi"}
          </p>

          <div className="border-forest/10 my-4 border-t" />

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
        <div className="border-sunset bg-summit/[0.04] flex flex-col border-2 p-7">
          <p className="text-summit/50 text-[11px] font-bold tracking-[0.08em] uppercase">
            Team
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-heading text-summit text-[28px] font-black">
              {teamPrice}
            </span>
            <span className="text-summit/60 text-[12px] font-medium uppercase">
              {teamPeriod}
            </span>
          </div>
          <p className="text-summit/50 mt-2 text-[13px]">
            Për klube të mëdha dhe federata
          </p>

          <div className="border-summit/8 my-4 border-t" />

          <p className="text-sunset mb-2.5 text-[10px] font-bold tracking-[0.1em] uppercase">
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
            className="border-sunset text-sunset hover:bg-sunset/10 mt-6 block border-2 py-[13px] text-center text-[12px] font-bold tracking-[0.08em] uppercase transition-colors"
          >
            Kontakto Ne
          </Link>
        </div>
      </div>
    </div>
  );
}
