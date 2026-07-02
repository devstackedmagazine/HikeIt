import type { Metadata } from "next";

import { TrailSubmitForm } from "@/components/features/trails/trail-submit-form";
import { getRequiredUser } from "@/lib/auth/helpers";

export const metadata: Metadata = { title: "Dërgo Shteg" };

export default async function SubmitTrailPage() {
  await getRequiredUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dërgo një Shteg</h1>
        <p className="text-muted-foreground">
          Ngarko një skedar GPX dhe ne plotësojmë automatikisht statistikat.
        </p>
      </div>
      <TrailSubmitForm />
    </div>
  );
}
