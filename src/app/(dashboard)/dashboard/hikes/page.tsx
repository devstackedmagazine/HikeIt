import { Footprints, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { formatKm } from "@/components/features/hikes/format";
import { HikeCard } from "@/components/features/hikes/hike-card";
import { HikeUploadForm } from "@/components/features/hikes/hike-upload-form";
import { EmptyState } from "@/components/shared/empty-state";
import { getRequiredUser } from "@/lib/auth/helpers";
import { getLinkableTrips, getUserHikes } from "@/server/queries/hikes";
import { getPersonalTotals } from "@/server/queries/personal-stats";

export const metadata: Metadata = { title: "Ecjet e mia" };

export default async function HikesPage({
  searchParams,
}: {
  searchParams: Promise<{ shto?: string }>;
}) {
  const user = await getRequiredUser();
  const { shto } = await searchParams;
  const adding = shto === "1";

  const [hikeList, linkableTrips, totals] = await Promise.all([
    getUserHikes(user.id),
    adding ? getLinkableTrips(user.id) : Promise.resolve([]),
    getPersonalTotals(user.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-forest/60 text-[10px] font-semibold tracking-[0.1em] uppercase">
            {totals.hikesCount} ecje · {formatKm(totals.totalKm)} gjithsej
          </p>
          <h1 className="font-heading text-forest mt-1 text-[clamp(22px,3vw,32px)] leading-[1.1] font-extrabold tracking-[-0.02em] uppercase">
            Ecjet e mia
          </h1>
        </div>
        {!adding ? (
          <Link
            href="/dashboard/hikes?shto=1"
            className="border-moss bg-moss text-abyss hover:bg-pine hover:text-summit flex items-center gap-1.5 border-2 px-4 py-2 text-[10px] font-bold tracking-[0.1em] uppercase transition-colors"
          >
            <Plus className="size-3.5" />
            Shto një ecje
          </Link>
        ) : (
          <Link
            href="/dashboard/hikes"
            className="text-forest/60 hover:text-forest text-[10px] font-bold tracking-[0.08em] uppercase"
          >
            Mbyll
          </Link>
        )}
      </div>

      {adding ? <HikeUploadForm linkableTrips={linkableTrips} /> : null}

      {hikeList.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hikeList.map((hike) => (
            <HikeCard key={hike.id} hike={hike} />
          ))}
        </div>
      ) : !adding ? (
        <EmptyState
          icon={Footprints}
          title="Ende pa ecje personale"
          description="Ngarko gjurmën GPX të çdo ecjeje — edhe atyre vetëm — dhe kilometrat numërohen në totalin tënd."
          action={{ label: "Shto një ecje", href: "/dashboard/hikes?shto=1" }}
        />
      ) : null}
    </div>
  );
}
