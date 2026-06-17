import { Map } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Shtigje",
  description:
    "Shfleto shtigjet malore në Kosovë dhe Ballkan — së shpejti në HikeIt.",
  alternates: { canonical: "https://hikeit.app/trails" },
};

export default function TrailsPage() {
  return (
    <ComingSoon
      icon={Map}
      title="Shtigjet"
      subtitle="Shfleto shtigje me filtra, hartë dhe skedarë GPX."
    />
  );
}
