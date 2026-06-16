import { Mail, Mountain } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Rreth nesh",
  description:
    "HikeIt u krijua për të bashkuar komunitetin e alpinizmit në Kosovë dhe Ballkan.",
  alternates: { canonical: "https://hikeit.app/about" },
};

const STATS = [
  { value: "25+", label: "klube" },
  { value: "100+", label: "shtigje" },
  { value: "3", label: "vende" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mountain className="size-7" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          HikeIt u krijua për të bashkuar komunitetin e alpinizmit në Kosovë
        </h1>
      </div>

      <div className="mt-12 space-y-4 text-lg leading-relaxed text-muted-foreground">
        <p>
          Kosova ka male të mahnitshme — nga Bjeshkët e Nemuna te Sharri — por
          deri tani nuk kishte një platformë të vërtetë për t&apos;i lidhur
          hikerët me klubet dhe shtigjet. Udhëtimet organizoheshin nëpër grupe
          Facebook dhe WhatsApp, ku informacioni humbej lehtë.
        </p>
        <p>
          HikeIt e ndryshon këtë: një vend i vetëm ku zbulon shtigje, bashkohesh
          me klube dhe rezervon udhëtime — me siguri, alerts moti dhe një
          komunitet që rritet bashkë.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-4 rounded-2xl border bg-muted/30 p-8 text-center">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-bold text-primary">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Ekipi</h2>
        <div className="mt-6 flex flex-col items-center gap-3">
          <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            FG
          </span>
          <div>
            <p className="font-medium">Themelues</p>
            <p className="text-sm text-muted-foreground">HikeIt</p>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-3 border-t pt-10 text-center">
        <h2 className="text-xl font-semibold">Na kontakto</h2>
        <Button
          variant="outline"
          render={<Link href="mailto:hello@hikeit.app" />}
        >
          <Mail />
          hello@hikeit.app
        </Button>
      </div>
    </div>
  );
}
