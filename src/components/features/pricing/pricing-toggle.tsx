"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface Feature {
  label: string;
  included: boolean;
}

interface Tier {
  name: string;
  audience: string;
  monthly: number;
  annual: number | null;
  freeForever?: boolean;
  features: Feature[];
  cta: { label: string; href: string };
  highlighted?: boolean;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    name: "Free (Hiker)",
    audience: "Për hikerë individualë",
    monthly: 0,
    annual: 0,
    freeForever: true,
    features: [
      { label: "Shfleto të gjitha shtigjet", included: true },
      { label: "Bashkohu me udhëtime falas", included: true },
      { label: "Profil personal", included: true },
      { label: "Njoftime moti", included: true },
      { label: "Krijo udhëtime", included: false },
      { label: "Menaxho klub", included: false },
    ],
    cta: { label: "Fillo falas", href: "/register" },
  },
  {
    name: "Pro Club",
    audience: "Për klube alpinizmi",
    monthly: 19,
    annual: 190,
    features: [
      { label: "Gjithçka në Free", included: true },
      { label: "Anëtarë të pakufizuar", included: true },
      { label: "Udhëtime të pakufizuara", included: true },
      { label: "Mbledh pagesa online", included: true },
      { label: "Dashboard analitike", included: true },
      { label: "Suport me email", included: true },
    ],
    cta: {
      label: "Fillo provën 14-ditore",
      href: "/register?type=club&plan=pro",
    },
    highlighted: true,
    badge: "Më popullor",
  },
  {
    name: "Team Club",
    audience: "Për klube të mëdha dhe federata",
    monthly: 49,
    annual: 490,
    features: [
      { label: "Gjithçka në Pro", included: true },
      { label: "Admin të shumëfishtë", included: true },
      { label: "Analitikë të avancuara", included: true },
      { label: "Akses API", included: true },
      { label: "Suport prioritar", included: true },
      { label: "Listing i sponsorizuar", included: true },
    ],
    cta: { label: "Kontakto ne", href: "mailto:hello@hikeit.app" },
  },
];

function formatPrice(tier: Tier, annual: boolean) {
  if (tier.freeForever) {
    return { amount: "€0", period: "/ përgjithmonë" };
  }
  if (annual && tier.annual !== null) {
    return { amount: `€${tier.annual}`, period: "/ vit" };
  }
  return { amount: `€${tier.monthly}`, period: "/ muaj" };
}

export function PricingToggle() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={cn(
            "text-sm font-medium transition-colors",
            annual ? "text-muted-foreground" : "text-foreground",
          )}
        >
          Mujore
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-label="Ndërro mes pagesës mujore dhe vjetore"
          onClick={() => setAnnual((v) => !v)}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary/20 transition-colors"
        >
          <span
            className={cn(
              "inline-block size-5 rounded-full bg-primary transition-transform",
              annual ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
        <span className="flex items-center gap-2 text-sm font-medium">
          Vjetore
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
            2 muaj falas
          </span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const price = formatPrice(tier, annual);
          return (
            <Card
              key={tier.name}
              className={cn(
                "relative flex flex-col",
                tier.highlighted && "border-primary shadow-lg",
              )}
            >
              {tier.badge ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {tier.badge}
                </span>
              ) : null}
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.audience}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{price.amount}</span>
                  <span className="text-sm text-muted-foreground">
                    {price.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature.label}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        !feature.included && "text-muted-foreground",
                      )}
                    >
                      {feature.included ? (
                        <Check className="size-4 shrink-0 text-primary" />
                      ) : (
                        <X className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      {feature.label}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  variant={tier.highlighted ? "default" : "outline"}
                  render={<Link href={tier.cta.href} />}
                >
                  {tier.cta.label}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
