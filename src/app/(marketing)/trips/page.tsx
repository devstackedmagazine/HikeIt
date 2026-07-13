import type { Metadata } from "next";
import Link from "next/link";
import {
  createSearchParamsCache,
  createSerializer,
  type SearchParams,
} from "nuqs/server";

import { TripCard } from "@/components/features/trips/trip-card";
import { TripFilters } from "@/components/features/trips/trip-filters";
import type { Trip } from "@/lib/db/schema";
import { tripsParsers } from "@/lib/search-params/trips";
import { cn } from "@/lib/utils/cn";
import { getTrailRegions } from "@/server/queries/trails";
import { getPublicTrips } from "@/server/queries/trips";

export const metadata: Metadata = {
  title: "Udhëtimet e Ardhshme Alpine — Rezervo Aventurën Tënde",
  description:
    "Shiko udhëtimet e planifikuara të alpinizmit në Kosovë. Bashkohu me grupe, eksploro shtigje të reja dhe rezervo udhëtimin tënd të radhës.",
  alternates: { canonical: "https://hikeit.app/trips" },
};

const cache = createSearchParamsCache(tripsParsers);
const serialize = createSerializer(tripsParsers);
const LIMIT = 9;

function dateRange(v: string): "week" | "month" | "quarter" | undefined {
  return v === "week" || v === "month" || v === "quarter" ? v : undefined;
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await cache.parse(searchParams);

  const [regions, { trips, total }] = await Promise.all([
    getTrailRegions(),
    getPublicTrips({
      difficulty: (filters.difficulty || undefined) as Trip["difficulty"],
      region: filters.region || undefined,
      dateRange: dateRange(filters.dateRange),
      freeOnly: filters.free === "1",
      page: filters.page,
      limit: LIMIT,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const currentPage = Math.min(filters.page, totalPages);

  return (
    <div className="bg-abyss">
      {/* Header + filter bar (Forest) */}
      <div className="bg-forest px-6 pt-8 sm:px-8">
        <p className="mb-2.5 text-[10px] font-bold tracking-[0.15em] text-moss uppercase">
          Aventura
        </p>
        <h1 className="font-heading mb-3.5 text-[clamp(32px,5vw,56px)] leading-none font-extrabold tracking-[-0.03em] text-summit uppercase">
          Udhëtimet e Ardhshme
        </h1>
        <p className="mb-6 max-w-[480px] text-[13px] leading-[1.65] text-summit/55">
          [{total}] udhëtime të planifikuara në rajon. Eksploro shtigjet më të
          bukura me komunitetin tonë të bjeshkatarëve.
        </p>
        <div className="pb-5">
          <TripFilters regions={regions} />
        </div>
      </div>

      {/* Cards grid (Abyss) */}
      <div className="px-6 pt-6 pb-12 sm:px-8">
        {trips.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center border border-summit/10 bg-summit/[0.03] p-10 text-center">
            <p className="font-heading text-base font-extrabold text-summit uppercase">
              Asnjë udhëtim nuk u gjet
            </p>
            <p className="mt-2 text-xs text-summit/45">
              Provo të ndryshosh filtrat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hrefFor={(page) => `/trips${serialize({ ...filters, page })}`}
          />
        ) : null}
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  hrefFor,
}: {
  currentPage: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  const cellClass =
    "flex size-8 items-center justify-center border text-[13px] font-semibold transition-colors";
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center gap-1 pt-8">
      <Link
        href={hrefFor(Math.max(1, currentPage - 1))}
        aria-label="Faqja e mëparshme"
        className={cn(
          cellClass,
          "border-summit/15 text-summit/50 hover:border-summit/40 hover:text-summit",
          currentPage <= 1 && "pointer-events-none opacity-40",
        )}
      >
        ‹
      </Link>
      {pages.map((page) => (
        <Link
          key={page}
          href={hrefFor(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={cn(
            cellClass,
            page === currentPage
              ? "border-summit/40 bg-summit/10 text-summit"
              : "border-summit/15 text-summit/50 hover:border-summit/40 hover:text-summit",
          )}
        >
          {page}
        </Link>
      ))}
      <Link
        href={hrefFor(Math.min(totalPages, currentPage + 1))}
        aria-label="Faqja tjetër"
        className={cn(
          cellClass,
          "border-summit/15 text-summit/50 hover:border-summit/40 hover:text-summit",
          currentPage >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        ›
      </Link>
    </div>
  );
}
