import type { Metadata } from "next";

import { ClubWizard } from "@/components/features/clubs/club-wizard";

export const metadata: Metadata = { title: "Krijo Klub" };

export default function CreateClubPage() {
  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-black uppercase">
          Krijo klubin tënd
        </h1>
        <p className="text-muted-foreground">
          Tri hapa të shpejtë për të nisur.
        </p>
      </div>
      <ClubWizard />
    </div>
  );
}
