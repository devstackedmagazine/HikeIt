import { Mail } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import logo from "../../../../public/logos/Hikeit-pfp.png"

export const metadata: Metadata = {
  title: "Rreth nesh",
  description:
    "HikeIt u krijua për të bashkuar komunitetin e alpinizmit në Kosovë dhe Ballkan.",
  alternates: { canonical: "https://hikeit.app/about" },
};

const STATS = [
  { value: "00+", label: "klube" },
  { value: "000+", label: "shtigje" },
  { value: "3", label: "vende" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="space-y-4 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-2xl">
          {/* <Mountain className="size-7" /> */}
          <Image src={logo} alt="HikeIt logo"/>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-sage sm:text-5xl">
          HikeIt u krijua për të bashkuar komunitetin e alpinizmit në Kosovë
        </h1>
      </div>

      <div className="text-sage mt-12 space-y-4 text-lg leading-relaxed">
        <p>
          Kosova ka male të mahnitshme — nga Bjeshkët e Nemuna te Sharri — por
          deri tani nuk kishte një platformë të vërtetë për t&apos;i lidhur
          hikerët me klubet dhe shtigjet. Udhëtimet organizoheshin nëpër grupe
          Facebook dhe WhatsApp, ku informacioni humbej lehtë.
        </p>
        <p>
          HikeIt e ndryshon këtë: një vend i vetëm ku zbulon shtigje, bashkohesh
          me klube dhe rezervon udhëtime — me siguri, njoftime moti dhe një
          komunitet që rritet bashkë.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-3 divide-x-2 divide-moss border-2 border-moss bg-forest text-center">
        {STATS.map((stat) => (
          <div key={stat.label} className="px-8 py-6">
            <p className="font-heading text-4xl font-black uppercase text-moss">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-bold tracking-[0.15em] text-summit uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-forest px-6 py-12 text-center">
        <h2 className="text-xs font-bold tracking-[0.15em] text-moss uppercase">
          Ekipi
        </h2>
        <div className="mt-6 flex flex-col items-center gap-3 border-2 border-moss bg-abyss px-8 py-6">
          <span className="flex size-20 items-center justify-center bg-moss text-2xl font-black text-abyss">
            FG
          </span>
          <div>
            <p className="text-lg font-black text-summit uppercase">
              Fatlum Gërxhaliu
            </p>
            <p className="text-xs tracking-widest text-moss uppercase">
              HikeIt Founder
            </p>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-forest bg-abyss px-6 py-12 text-center">
        <h2 className="text-xs font-bold tracking-[0.15em] text-moss uppercase">
          Na kontakto
        </h2>
        <Link
          href="mailto:hello@hikeit.app"
          className="mx-auto mt-6 flex w-full max-w-sm items-center justify-center gap-2 border-2 border-moss bg-transparent py-3.5 text-sm font-bold tracking-[0.06em] text-moss uppercase transition-colors hover:bg-moss hover:text-abyss"
        >
          <Mail className="size-4" />
          hello@hikeit.app
        </Link>
      </div>
    </div>
  );
}
