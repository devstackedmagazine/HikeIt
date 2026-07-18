import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TripForm } from "@/components/features/trips/trip-form";
import { getRequiredUser, requireClubAdmin } from "@/lib/auth/helpers";
import { getTrailOptions } from "@/server/queries/trails";

export const metadata: Metadata = { title: "Krijo Udhëtim" };

export default async function CreateTripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getRequiredUser();
  const access = await requireClubAdmin(user.id, slug);
  if (!access) notFound();

  const trailOptions = await getTrailOptions();
  // Any club can set a price; the form only *warns* if Stripe isn't active yet.
  const stripeActive =
    access.organization.stripeAccountStatus === "active";

  return (
    <div className="-mx-6 -my-5 min-h-svh bg-abyss px-6 py-5 pb-24 md:pb-12">
      <p className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-medium tracking-[0.06em] text-summit/35 uppercase">
        <span>Klubi</span>
        <span className="text-summit/20">·</span>
        <span>Udhëtimet</span>
        <span className="text-summit/20">·</span>
        <span className="text-summit/55">Krijo të ri</span>
      </p>
      <h1 className="font-heading mb-6 text-[clamp(24px,4vw,40px)] leading-none font-extrabold tracking-[-0.02em] text-summit uppercase">
        Krijo udhëtim të ri
      </h1>

      <div className="max-w-[640px]">
        <TripForm
          clubSlug={slug}
          trailOptions={trailOptions}
          stripeActive={stripeActive}
        />
      </div>
    </div>
  );
}
