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
    <div className="bg-abyss">
      {/* Header — light section */}
      <div className="bg-mist px-6 py-16 text-center sm:px-10">
        <p className="mb-3 text-[11px] font-bold tracking-[0.15em] text-moss uppercase">
          Çmimet
        </p>
        <h1 className="font-heading mb-3 text-[28px] font-black tracking-[-0.01em] text-forest uppercase">
          Zgjidh Planin Tënd
        </h1>
        <p className="mx-auto max-w-md text-[14px] text-forest/55">
          Zgjidhni paketën që i përshtatet stilit tuaj të eksplorimit.
        </p>
      </div>

      <PricingToggle />
    </div>
  );
}
