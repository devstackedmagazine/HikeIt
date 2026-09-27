import type { Metadata } from "next";

import { TrailSubmitForm } from "@/components/features/trails/trail-submit-form";
import { getRequiredUser } from "@/lib/auth/helpers";

export const metadata: Metadata = { title: "Propozo një shteg" };

export default async function SubmitTrailPage() {
  await getRequiredUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-moss mb-1.5 text-[10px] font-bold tracking-[0.15em] uppercase">
          Propozo
        </p>
        <h1 className="font-heading text-forest text-[clamp(24px,4vw,32px)] leading-[1.1] font-extrabold tracking-[-0.02em] uppercase">
          Propozo një shteg
        </h1>
        <p className="text-forest/70 mt-2 text-sm">
          Ngarko një skedar GPX dhe ne plotësojmë automatikisht statistikat.
        </p>
      </div>
      <div className="border-alert bg-alert/10 text-forest border-l-4 px-4 py-3 text-sm leading-[1.6]">
        <strong className="font-bold">Shtegu shqyrtohet para publikimit.</strong>{" "}
        Pasi ta dërgosh, e sheh vetëm ti derisa ekipi i HikeIt ta miratojë.
        Pas miratimit shfaqet në listën e shtigjeve dhe mund të zgjidhet për
        udhëtime.
      </div>
      <TrailSubmitForm />
    </div>
  );
}
