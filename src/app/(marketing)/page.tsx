import {
  Check,
  ChevronDown,
  CloudLightning,
  Map,
  Mountain,
  Shield,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { WaitlistForm } from "@/components/features/waitlist/waitlist-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "HIKEIT — Komuniteti i Alpinizmit në Kosovë" },
  description:
    "Gjej shtigje, bashkohu me klube dhe rezervo udhëtime malore në Kosovë dhe Ballkan.",
  keywords: [
    "hiking Kosovo",
    "alpinizëm Kosovë",
    "klube alpinizmi",
    "shtigje malore",
  ],
  alternates: { canonical: "https://hikeit.app" },
  openGraph: {
    type: "website",
    title: "HIKEIT — Komuniteti i Alpinizmit në Kosovë",
    description:
      "Gjej shtigje, bashkohu me klube dhe rezervo udhëtime malore në Kosovë dhe Ballkan.",
    url: "https://hikeit.app",
    siteName: "HikeIt",
  },
};

const STEPS = [
  {
    icon: Users,
    title: "Regjistrohu",
    description: "Krijo profilin tënd falas në 2 minuta.",
  },
  {
    icon: Map,
    title: "Zgjidh Aventurën",
    description: "Shfleto shtigjet dhe udhëtimet nga klubet lokale.",
  },
  {
    icon: Mountain,
    title: "Ngjitu Bashkë",
    description: "Bashkohu me komunitetin dhe ngjit majat.",
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Menaxhim Klubit",
    description:
      "Klubet menaxhojnë anëtarët, udhëtimet dhe pagesat në një vend.",
  },
  {
    icon: CloudLightning,
    title: "Alerts Moti",
    description: "Paralajmërime automatike përpara kushteve të rrezikshme.",
  },
  {
    icon: Map,
    title: "Shtigje GPS",
    description: "Shkarko skedarë GPX për navigim offline në mal.",
  },
];

const CLUB_BENEFITS = [
  "Mbledh pagesa online",
  "Menaxho anëtarët",
  "Dërgo alerts automatike",
];

const STATS = [
  { value: "25+", label: "KLUBE" },
  { value: "15+", label: "SHTIGJE" },
  { value: "500+", label: "HIKER" },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden bg-abyss px-4 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(76,175,125,0.18),_transparent_60%)]" />
        <div className="relative mx-auto max-w-[900px]">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-moss">
            🇽🇰 KOSOVO · BALLKAN · ALPET
          </p>
          <h1 className="font-heading text-[clamp(3rem,8vw,6rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.04em] text-summit">
            ZBULO.
            <br />
            <span className="text-moss">NGJIT.</span>
            <br />
            GJEJ PAQEN.
          </h1>
          <p className="mx-auto mt-5 max-w-[480px] text-base text-summit/55">
            Platforma e alpinizmit për Kosovën dhe Ballkanin.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="moss"
              size="xl"
              render={<Link href="/register" />}
            >
              Fillo Falas →
            </Button>
            <Button
              size="xl"
              className="border-summit/20 bg-transparent text-summit hover:bg-summit/10 hover:border-summit/40"
              render={<Link href="/trails" />}
            >
              Shiko Shtigjet
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-10 border-t-2 border-summit/10 pt-6">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-[28px] font-extrabold text-moss">
                  {stat.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-summit/40">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <Link
          href="#si-funksionon"
          aria-label="Si funksionon"
          className="absolute bottom-6 animate-bounce text-summit/60 hover:text-summit"
        >
          <ChevronDown className="size-7" />
        </Link>
      </section>

      {/* How it works */}
      <section id="si-funksionon" className="bg-summit py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-moss">
              SI FUNKSIONON
            </p>
            <h2 className="font-heading text-4xl font-extrabold uppercase tracking-tight text-forest">
              Tre Hapa. Një Komunitet.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative border-2 border-forest p-6">
                <span className="absolute right-4 top-2 font-heading text-[80px] font-extrabold leading-none text-forest/[0.07]">
                  0{index + 1}
                </span>
                <step.icon className="relative size-8 text-moss" />
                <h3 className="relative mt-4 text-lg font-extrabold uppercase tracking-tight text-forest">
                  {step.title}
                </h3>
                <p className="relative mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y-2 border-forest bg-forest py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-moss">
            ÇFARË OFRON
          </p>
          <h2 className="mb-12 font-heading text-4xl font-extrabold uppercase tracking-tight text-summit">
            Ndërtuar Për Malin
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="border-2 border-moss/20 p-6 transition-colors hover:border-moss"
              >
                <feature.icon className="size-8 text-moss" />
                <h3 className="mt-4 text-lg font-extrabold uppercase tracking-tight text-summit">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-summit/60">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For clubs */}
      <section className="bg-abyss py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-moss">
              PËR ORGANIZATORËT
            </p>
            <h2 className="font-heading text-4xl font-extrabold uppercase tracking-tight text-summit">
              Për Organizatorët e Klubeve
            </h2>
            <p className="mt-4 text-lg text-summit/55">
              A lodheni me Facebook dhe WhatsApp për të organizuar udhëtime?
            </p>
            <ul className="mt-6 space-y-3">
              {CLUB_BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-3 text-summit"
                >
                  <Check className="size-5 shrink-0 text-moss" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-2 border-moss p-8">
            <h3 className="text-2xl font-extrabold uppercase tracking-tight text-summit">
              Gati për të nisur?
            </h3>
            <p className="mt-3 text-summit/55">
              Regjistro klubin tënd falas dhe fillo të organizosh brenda
              minutash.
            </p>
            <Button
              variant="moss"
              size="lg"
              className="mt-6 w-full"
              render={<Link href="/register?type=club" />}
            >
              Regjistro Klubin →
            </Button>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="bg-forest py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-heading text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold uppercase tracking-tight text-summit">
            Ji i Pari.
          </h2>
          <p className="mt-4 text-lg text-summit/60">
            Lër email-in tënd dhe bëhu i pari që merr akses.
          </p>
          <div className="mt-8">
            <WaitlistForm />
          </div>
          <p className="mt-4 text-xs text-summit/40">
            Pa spam. Vetëm njoftime për lançimin.
          </p>
        </div>
      </section>
    </>
  );
}
