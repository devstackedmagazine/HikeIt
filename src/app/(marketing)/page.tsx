import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  CloudLightning,
  Map,
  Mountain,
  Shield,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "HikeIt — Komuniteti i Alpinizmit në Kosovë" },
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
    title: "HikeIt — Komuniteti i Alpinizmit në Kosovë",
    description:
      "Gjej shtigje, bashkohu me klube dhe rezervo udhëtime malore në Kosovë dhe Ballkan.",
    url: "https://hikeit.app",
    siteName: "HikeIt",
  },
};

import { WaitlistForm } from "@/components/features/waitlist/waitlist-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STEPS = [
  {
    icon: Users,
    title: "Regjistrohu",
    description: "Krijo profilin tënd falas në 2 minuta",
  },
  {
    icon: Map,
    title: "Zgjidh aventurën",
    description: "Shfleto shtigjet dhe udhëtimet nga klubet lokale",
  },
  {
    icon: Mountain,
    title: "Ngjitu bashkë",
    description: "Bashkohu me komunitetin dhe ngjit majat",
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Menaxhim i Klubit",
    description:
      "Klubet menaxhojnë anëtarët, udhëtimet dhe pagesat në një vend të vetëm.",
  },
  {
    icon: CloudLightning,
    title: "Njoftime Moti",
    description:
      "Paralajmërime automatike të motit përpara kushteve të rrezikshme.",
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
  "Dërgo njoftime automatike",
];

const TESTIMONIALS = [
  {
    quote:
      "Më në fund një vend ku gjej të gjitha udhëtimet malore në Kosovë. E thjeshtë dhe e shpejtë.",
    name: "Arben K.",
    city: "Prishtinë",
  },
  {
    quote:
      "Si organizator, kursej orë të tëra çdo javë. Pagesat dhe regjistrimet tani janë automatike.",
    name: "Vjosa M.",
    city: "Pejë",
  },
  {
    quote:
      "Njoftimet e motit më shpëtuan një herë nga një stuhi. Komunitet i mrekullueshëm!",
    name: "Driton S.",
    city: "Gjakovë",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-emerald-950 px-4 py-20 text-center text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12),_transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Gjej shtegun tënd. Gjej komunitetin tënd.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/85 text-balance sm:text-xl">
            HikeIt bashkon hikerët dhe klubet e alpinizmit në Kosovë dhe Ballkan.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-6 text-base"
              render={<Link href="/register" />}
            >
              Fillo sot
              <ArrowRight />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-primary-foreground/40 bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              render={<Link href="/trails" />}
            >
              Shiko shtegun
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/75">
            25+ klube • 500+ hiker • 100+ shtigje
          </p>
        </div>
        <Link
          href="#si-funksionon"
          aria-label="Shko te seksioni si funksionon"
          className="absolute bottom-6 animate-bounce text-primary-foreground/70 hover:text-primary-foreground"
        >
          <ChevronDown className="size-7" />
        </Link>
      </section>

      {/* How it works */}
      <section id="si-funksionon" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Si funksionon
            </h2>
            <p className="mt-2 text-muted-foreground">Tri hapa të thjeshtë</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="relative mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon className="size-8" />
                  <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Çfarë ofron HikeIt
            </h2>
            <p className="mt-2 text-muted-foreground">
              Gjithçka që të duhet për malin
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <feature.icon className="size-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For clubs */}
      <section className="bg-gradient-to-br from-primary to-emerald-950 px-4 py-20 text-primary-foreground sm:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Për Organizatorët e Klubeve
            </h2>
            <p className="text-lg text-primary-foreground/85">
              A lodheni me Facebook dhe WhatsApp për të organizuar udhëtime?
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-6 text-base"
              render={<Link href="/register?type=club" />}
            >
              Regjistro klubin tënd
              <ArrowRight />
            </Button>
          </div>
          <ul className="space-y-4">
            {CLUB_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-lg">
                <CheckCircle className="size-6 shrink-0 text-accent" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Çfarë thonë hikerët
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="space-y-4 pt-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    “{testimonial.quote}”
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {testimonial.name
                        .split(" ")
                        .map((part) => part.charAt(0))
                        .join("")}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.city}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="bg-gradient-to-br from-emerald-950 to-primary px-4 py-20 text-center text-primary-foreground sm:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Jemi duke u hapur shpejt
          </h2>
          <p className="text-lg text-primary-foreground/85">
            Lër email-in tënd dhe bëhu i pari që merr akses.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </>
  );
}
