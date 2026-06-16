import type { Metadata } from "next";

import { PricingToggle } from "@/components/features/pricing/pricing-toggle";

export const metadata: Metadata = {
  title: "Çmimet",
  description:
    "Plane të thjeshta për hikerë dhe klube alpinizmi. Fillo falas ose provo Pro Club 14 ditë.",
  alternates: { canonical: "https://hikeit.app/pricing" },
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Çmime të thjeshta
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
          Falas për hikerët, gjithmonë. Plane fleksibile për klubet.
        </p>
      </div>
      <PricingToggle />
    </div>
  );
}
