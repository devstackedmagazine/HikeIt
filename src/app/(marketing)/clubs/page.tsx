import { Users } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Klube",
  description:
    "Zbulo klubet e alpinizmit në Kosovë dhe bashkohu me komunitetin — së shpejti.",
  alternates: { canonical: "https://hikeit.app/clubs" },
};

export default function ClubsPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Klubet"
      subtitle="Zbulo klubet e alpinizmit dhe bashkohu me to."
    />
  );
}
