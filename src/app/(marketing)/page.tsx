import {
  Building2,
  CheckCircle2,
  CloudLightning,
  Compass,
  LayoutGrid,
  Map,
  UserPlus,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { WaitlistForm } from "@/components/features/waitlist/waitlist-form";

export const metadata: Metadata = {
  title: { absolute: "HIKEIT — Komuniteti i Alpinizmit në Kosovë" },
  description:
    "Platforma e alpinizmit për Kosovën dhe Ballkanin. Gjeni shtigje të verifikuara, bashkohuni me klubet më aktive dhe eksploroni natyrën e egër.",
  alternates: { canonical: "https://hikeit.app" },
  openGraph: {
    type: "website",
    title: "HIKEIT — Komuniteti i Alpinizmit në Kosovë",
    description:
      "Platforma e alpinizmit për Kosovën dhe Ballkanin. Gjeni shtigje të verifikuara dhe bashkohuni me klubet më aktive.",
    url: "https://hikeit.app",
    siteName: "HikeIt",
  },
};

const STEPS = [
  {
    number: "01",
    icon: UserPlus,
    title: "Regjistrohu",
    description: "Krijo profilin tënd falas në më pak se dy minuta.",
  },
  {
    number: "02",
    icon: Compass,
    title: "Zgjidh Aventurën",
    description:
      "Shfleto shtigje të verifikuara dhe udhëtime nga klubet lokale.",
  },
  {
    number: "03",
    icon: Users,
    title: "Hik Bashkë",
    description: "Bashkohu me komunitetin dhe ngjit majat së bashku.",
  },
];

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Menaxhim Klubi",
    description:
      "Klubet menaxhojnë anëtarët, udhëtimet dhe pagesat nga një panel i vetëm.",
  },
  {
    icon: CloudLightning,
    title: "Alerts Moti",
    description:
      "Paralajmërime automatike përpara kushteve të rrezikshme në mal.",
  },
  {
    icon: Map,
    title: "Shtigje GPS",
    description: "Shkarko skedarë GPX për navigim offline kudo që shkon.",
  },
];

const CLUB_BENEFITS = [
  {
    title: "Automatizim i Plotë",
    description:
      "Regjistrime, pagesa dhe njoftime — të gjitha të automatizuara në një vend.",
  },
  {
    title: "Analitika e Performancës",
    description:
      "Ndiq pjesëmarrjen, të ardhurat dhe rritjen e klubit me të dhëna të qarta.",
  },
  {
    title: "Promovim i Targetuar",
    description:
      "Arri te hiker-at e duhur dhe mbush udhëtimet më shpejt se kurrë.",
  },
];

const STATS = [
  { value: "25+", label: "Klube aktive" },
  { value: "15+", label: "Shtigje të verifikuara" },
  { value: "500+", label: "Hiker të regjistruar" },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-abyss relative flex min-h-[calc(100svh-3.5rem)] flex-col overflow-hidden">
        {/* Mountain image from /public/hero/mountain.svg. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-[center_right]"
          style={{ backgroundImage: "url('/hero/mountain.svg')" }}
        />
        {/* Overlays: uniform dark wash + a left gradient for text legibility. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[rgba(13,31,20,0.55)]"
        />
        <div
          aria-hidden
          className="from-abyss/70 via-abyss/30 absolute inset-0 bg-gradient-to-r to-transparent"
        />

        <div className="relative z-10 max-w-[650px] px-6 pt-20 pb-40 sm:px-10 sm:pt-20">
          <p className="text-moss mb-5 text-[11px] font-bold tracking-[0.15em] uppercase">
            🇽🇰 Kosovo · Ballkan · Alpet
          </p>
          <h1 className="text-summit mb-6 text-[clamp(52px,7vw,88px)] leading-[0.92] font-extrabold tracking-[-0.04em] uppercase">
            Zbulo.
            <br />
            <span className="text-moss">Ngjit.</span>
            <br />
            Gjej Paqen.
          </h1>
          <p className="text-summit/75 mb-9 max-w-[480px] text-[15px] leading-[1.65] font-normal">
            Platforma e alpinizmit për Kosovën dhe Ballkanin. Gjeni shtigje të
            verifikuara, bashkohuni me klubet më aktive dhe eksploroni natyrën e
            egër si kurrë më parë.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="border-summit text-summit hover:bg-summit/10 border px-7 py-3.5 text-[13px] font-bold tracking-[0.08em] uppercase transition-colors"
            >
              Fillo Falas →
            </Link>
            <Link
              href="/trails"
              className="border-summit/35 text-summit/70 hover:border-summit/60 border px-7 py-3.5 text-[13px] font-semibold tracking-[0.08em] uppercase transition-colors"
            >
              Shfleto Shtigjet
            </Link>
          </div>
        </div>

        {/* Stats bar pinned to the bottom of the hero. */}
        <div className="border-summit/10 absolute right-0 bottom-0 left-0 z-10 border-t bg-[rgba(13,31,20,0.4)] px-6 py-7 sm:px-20">
          <div className="flex flex-wrap gap-x-20 gap-y-6">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-moss text-[42px] leading-none font-extrabold tracking-[-0.02em]">
                  {stat.value}
                </p>
                <p className="text-summit/50 mt-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="border-moss/25 bg-forest border-b px-6 py-20 sm:px-20">
        <p className="text-moss mb-4 text-[11px] font-bold tracking-[0.15em] uppercase">
          Si Funksionon
        </p>
        <h2 className="text-summit mb-14 text-[clamp(32px,4vw,48px)] font-extrabold tracking-[-0.03em] uppercase">
          Tre Hapa. Një Komunitet.
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="border-summit/12 bg-summit/[0.04] relative overflow-hidden border p-8"
            >
              <span className="font-heading text-moss/[0.12] pointer-events-none absolute top-4 left-6 z-0 text-[96px] leading-none font-extrabold">
                {step.number}
              </span>
              <div className="relative z-10">
                <span className="bg-moss/[0.12] text-moss mb-5 inline-flex p-2.5">
                  <step.icon className="size-7" />
                </span>
                <h3 className="text-summit mb-3 text-base font-extrabold tracking-[0.02em] uppercase">
                  {step.title}
                </h3>
                <p className="text-summit/60 text-sm leading-[1.65] font-normal">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="border-moss/20 bg-abyss border-b px-6 py-20 sm:px-20">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="border-summit/10 bg-summit/[0.03] flex min-h-[280px] flex-col border px-8 py-10"
            >
              <span className="bg-moss/10 text-moss mb-6 inline-flex w-fit p-2.5">
                <feature.icon className="size-7" />
              </span>
              <h3 className="text-summit mb-3.5 text-[15px] font-extrabold tracking-[0.04em] uppercase">
                {feature.title}
              </h3>
              <p className="text-summit/50 mb-6 text-[13px] leading-[1.7] font-normal">
                {feature.description}
              </p>
              <span aria-hidden className="bg-moss mt-auto block h-0.5 w-8" />
            </div>
          ))}
        </div>
      </section>

      {/* ── For clubs ───────────────────────────────────────────────────── */}
      <section className="bg-abyss px-6 py-20 sm:px-20">
        <div className="grid items-center gap-[60px] lg:grid-cols-[55fr_45fr]">
          <div>
            <h2 className="text-summit mb-9 text-[clamp(28px,3.5vw,44px)] leading-none font-extrabold tracking-[-0.03em] uppercase">
              Për Organizatorët e Klubeve
            </h2>
            <div className="flex flex-col gap-6">
              {CLUB_BENEFITS.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3.5">
                  <CheckCircle2 className="text-moss mt-0.5 size-[18px] shrink-0" />
                  <div>
                    <p className="text-moss mb-1 text-xs font-bold tracking-[0.1em] uppercase">
                      {benefit.title}
                    </p>
                    <p className="text-summit/60 text-[13px] leading-[1.6] font-normal">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-summit/15 bg-summit/[0.04] border p-10 text-center">
            <span className="bg-moss/10 text-moss mx-auto mb-6 inline-flex p-3.5">
              <Building2 className="size-8" />
            </span>
            <h3 className="text-summit mb-3 text-xl font-extrabold tracking-[-0.01em] uppercase">
              Gati të Rriteni?
            </h3>
            <p className="text-summit/55 mb-7 text-[13px] leading-[1.65] font-normal">
              Regjistro klubin tënd falas dhe fillo të organizosh udhëtime
              brenda minutash.
            </p>
            <Link
              href="/register?type=club"
              className="border-summit/40 text-summit hover:border-moss hover:text-moss block w-full border px-7 py-3.5 text-xs font-bold tracking-[0.1em] uppercase transition-colors"
            >
              Regjistro Klubin →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Waitlist / Beta ─────────────────────────────────────────────── */}
      <section className="bg-forest px-6 py-[100px] text-center sm:px-20">
        <h2 className="text-summit mb-5 text-[clamp(48px,7vw,88px)] font-extrabold tracking-[-0.04em] uppercase">
          Ji i Pari.
        </h2>
        <p className="text-summit/60 mx-auto mb-10 max-w-[560px] text-[15px] leading-[1.65] font-normal">
          HikeIt është aktualisht në fazën BETA. Lini email-in tuaj për të marrë
          ftesën për akses të hershëm dhe për të fituar statusin “Founding
          Hiker”.
        </p>
        <div className="mx-auto max-w-[560px]">
          <WaitlistForm source="landing" />
        </div>
      </section>
    </>
  );
}
