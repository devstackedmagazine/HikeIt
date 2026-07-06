import type { Metadata } from "next";
import Link from "next/link";
import { createSearchParamsCache, type SearchParams } from "nuqs/server";

import { ClubCard } from "@/components/features/clubs/club-card";
import {
  ClubCityTabs,
  ClubSearch,
} from "@/components/features/clubs/club-filters";
import { clubsParsers } from "@/lib/search-params/clubs";
import { getClubs } from "@/server/queries/clubs";

export const metadata: Metadata = {
  title: "Klube",
  description:
    "Gjej dhe bashkohu me klubet e alpinizmit në Kosovë — kërko sipas qytetit.",
  alternates: { canonical: "https://hikeit.app/clubs" },
};

const cache = createSearchParamsCache(clubsParsers);
const LIMIT = 12;

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await cache.parse(searchParams);
  const { clubs } = await getClubs({
    search: filters.search || undefined,
    city: filters.city || undefined,
    page: filters.page,
    limit: LIMIT,
  });

  return (
    <>
      {/* Header (light mint) */}
      <section className="bg-mist h-96 px-6 pt-10 pb-9 sm:px-10">
        <p className="text-pine mb-2.5 text-[10px] font-bold tracking-[0.15em] uppercase">
          Komuniteti
        </p>
        <h1 className="font-heading text-abyss mb-3.5 text-[clamp(28px,4vw,44px)] leading-none font-extrabold tracking-[-0.03em] uppercase">
          Klubet e Alpinizmit
        </h1>
        <p className="mb-7 max-w-[440px] text-[13px] leading-[1.65] text-[#3D5A47]">
          Gjej komunitetin tënd të alpinizmit dhe bashkohu me aventurierët që
          ndajnë të njëjtin pasion për majat e larta.
        </p>
        <ClubSearch />
      </section>

      {/* City filter band (dark forest) */}
      <div className="bg-forest flex h-20 items-center px-6 sm:px-10">
        <ClubCityTabs />
      </div>

      {/* Cards grid (light mint) */}
      <section className="bg-mist px-6 pt-8 pb-10 sm:px-10">
        {clubs.length === 0 ? (
          <div className="border-forest/15 bg-summit border px-6 py-12 text-center">
            <p className="font-heading text-abyss text-base font-extrabold uppercase">
              Asnjë klub nuk u gjet
            </p>
            <p className="mt-2 text-xs text-[#3D5A47]">
              Provoni një kërkim ose qytet tjetër.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </section>

      {/* CTA (dark forest) */}
      <section className="bg-forest px-6 py-[60px] text-center sm:px-10">
        <h2 className="font-heading text-summit mb-4 text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-0.03em] uppercase">
          A keni një klub?
        </h2>
        <p className="text-summit/60 mx-auto mb-7 max-w-[420px] text-sm leading-[1.65]">
          Regjistroni klubin tuaj në platformën{" "}
          <span className="text-moss">HikeIt</span> dhe rritni komunitetin tuaj
          të alpinizmit sot.
        </p>
        <Link
          href="/dashboard/club/create"
          className="border-moss text-moss hover:bg-moss/15 inline-block border px-7 py-3 text-xs font-bold tracking-[0.1em] uppercase transition-colors"
        >
          Shto Klubin Tënd
        </Link>
      </section>
    </>
  );
}
