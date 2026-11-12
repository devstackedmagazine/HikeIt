import type { Metadata } from "next";

import { TrailSubmitForm } from "@/components/features/trails/trail-submit-form";
import { getRequiredUser } from "@/lib/auth/helpers";
import { getTrailRegions } from "@/server/queries/trails";

export const metadata: Metadata = { title: "Propozoni shteg" };

/** Always on the dark (Forest) surface — the shell keeps this route dark for
 * every role — so all ink here is Summit, with Sage/Alert accents. */
export default async function SubmitTrailPage() {
  await getRequiredUser();
  // Same list as the /trails region filter, so an approved proposal shows up
  // under it.
  const regions = await getTrailRegions();

  return (
    <div className="mx-auto max-w-[640px] space-y-5">
      <div>
        <p className="text-sage mb-1.5 text-[10px] font-bold tracking-[0.15em] uppercase">
          Shtigjet
        </p>
        <h1 className="font-heading text-summit text-[clamp(28px,6vw,40px)] leading-[1.05] font-extrabold tracking-[-0.03em] uppercase">
          Propozoni shteg
        </h1>
        <p className="text-summit/75 mt-2 text-sm leading-[1.6]">
          Ngarkoni një skedar GPX dhe ne plotësojmë automatikisht distancën,
          ngjitjen dhe hartën.
        </p>
      </div>

      {/* Alert colour on the border only; the text stays Summit for
          contrast on Forest. */}
      <div className="border-alert bg-summit/[0.05] text-summit/90 border-l-4 px-4 py-3 text-sm leading-[1.6]">
        <strong className="text-summit font-bold">
          Shtegu shqyrtohet para publikimit.
        </strong>{" "}
        Pasi ta dërgoni, e shihni vetëm ju derisa ekipi i HikeIt ta miratojë.
        Pas miratimit shfaqet në listën e shtigjeve dhe mund të zgjidhet për
        udhëtime.
      </div>

      <TrailSubmitForm regions={regions} />
    </div>
  );
}
