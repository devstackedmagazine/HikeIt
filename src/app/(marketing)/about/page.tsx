import { Mail } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import logo from "../../../../public/logos/Hikeit-pfp.png";

export const metadata: Metadata = {
  title: "Rreth nesh",
  description:
    "HikeIt u krijua për të bashkuar komunitetin e alpinizmit në Kosovë dhe Ballkan.",
  alternates: { canonical: "https://hikeit.app/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="space-y-4 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-2xl">
          {/* <Mountain className="size-7" /> */}
          <Image src={logo} alt="HikeIt logo" />
        </div>
        <h1 className="text-sage text-4xl font-bold tracking-tight sm:text-5xl">
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

      <div className="bg-forest mt-12 px-6 py-12 text-center">
        <h2 className="text-sage text-xs font-bold tracking-[0.15em] uppercase">
          Ekipi
        </h2>
        <div className="border-moss bg-abyss mt-6 flex flex-col items-center gap-3 border-2 px-8 py-6">
          <span className="bg-moss text-abyss flex size-20 items-center justify-center text-2xl font-black">
            FG
          </span>
          <div>
            <p className="text-summit text-lg font-black uppercase">
              Fatlum Gërxhaliu
            </p>
            <p className="text-moss text-xs tracking-widest uppercase">
              HikeIt Founder
            </p>
          </div>
        </div>
      </div>

      <div className="border-forest bg-abyss border-t-2 px-6 py-12 text-center">
        <h2 className="text-sage text-xs font-bold tracking-[0.15em] uppercase">
          Na kontakto
        </h2>
        <Link
          href="mailto:hello@hikeit.app"
          className="border-moss text-moss hover:bg-moss hover:text-abyss mx-auto mt-6 flex w-full max-w-sm items-center justify-center gap-2 border-2 bg-transparent py-3.5 text-sm font-bold tracking-[0.06em] uppercase transition-colors"
        >
          <Mail className="size-4" />
          hello@hikeit.app
        </Link>
      </div>
    </div>
  );
}
