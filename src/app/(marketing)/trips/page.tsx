import { Calendar } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Udhëtime",
  description:
    "Gjej dhe rezervo udhëtime malore të organizuara nga klubet — së shpejti.",
  alternates: { canonical: "https://hikeit.app/trips" },
};

export default function TripsPage() {
  return (
    <ComingSoon
      icon={Calendar}
      title="Udhëtimet"
      subtitle="Gjej dhe rezervo udhëtime malore nga klubet lokale."
    />
  );
}
