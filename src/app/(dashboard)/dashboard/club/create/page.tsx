import type { Metadata } from "next";

import { ClubWizard } from "@/components/features/clubs/club-wizard";

export const metadata: Metadata = { title: "Krijoni Klub" };

export default function CreateClubPage() {
  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-black uppercase">
          Krijoni klubin tuaj
        </h1>
        <p className="text-muted-foreground">
          Tri hapa të shpejtë për të nisur.
        </p>
      </div>
      <ClubWizard />
    </div>
  );
}
