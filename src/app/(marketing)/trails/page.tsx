import type { Metadata } from "next";
import Link from "next/link";
import {
  createSearchParamsCache,
  createSerializer,
  type SearchParams,
} from "nuqs/server";

import { TrailCard } from "@/components/features/trails/trail-card";
import { TrailFilters } from "@/components/features/trails/trail-filters";
import { TrailSearch } from "@/components/features/trails/trail-search";
import type { Trail } from "@/lib/db/schema";
import { trailsParsers } from "@/lib/search-params/trails";
import { cn } from "@/lib/utils/cn";
import { getTrailRegions, getTrails } from "@/server/queries/trails";

export const metadata: Metadata = {
  title: "Shtigje",
  description:
    "Shfleto shtigjet malore të verifikuara në Kosovë — filtro sipas vështirësisë, rajonit dhe stinës.",
  alternates: { canonical: "https://hikeit.app/trails" },
};

const cache = createSearchParamsCache(trailsParsers);
const serialize = createSerializer(trailsParsers);
const LIMIT = 6;

export default async function TrailsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await cache.parse(searchParams);

  const [regions, { trails, total }] = await Promise.all([
    getTrailRegions(),
    getTrails({
      search: filters.search || undefined,
      difficulty: filters.difficulty as Trail["difficulty"][],
      region: filters.region || undefined,
      season: filters.season,
      features: filters.features,
      page: filters.page,
      limit: LIMIT,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const currentPage = Math.min(filters.page, totalPages);

  return (
    <div className="bg-abyss">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 px-6 pt-6 sm:flex-row sm:items-start">
        <div>
          <p className="mb-1.5 text-[10px] font-bold tracking-[0.15em] text-moss uppercase">
            Eksploro
          </p>
          <h1 className="font-heading mb-2 text-[22px] font-extrabold tracking-[-0.02em] text-summit uppercase">
            Shtigjet e Kosovës
          </h1>
          <p className="text-xs font-normal text-summit/45">
            [{total}] shtigje të verifikuara nga komuniteti i ekspertëve të
            HIKEIT.
          </p>
        </div>
        <TrailSearch />
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-40">
          <TrailFilters regions={regions} />
        </aside>

        <div className="flex-1">
          {trails.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center border border-summit/10 bg-summit/[0.03] p-10 text-center">
              <p className="font-heading text-base font-extrabold text-summit uppercase">
                Asnjë shteg nuk u gjet
              </p>
              <p className="mt-2 text-xs text-summit/45">
                Provoni të ndryshoni filtrat ose pastrojini ato.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trails.map((trail) => (
                <TrailCard key={trail.id} trail={trail} />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hrefFor={(page) => `/trails${serialize({ ...filters, page })}`}
            />
          ) : null}
        </div>
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
    <div className="flex justify-center gap-1 pt-8 pb-12">
      <Link
        href={hrefFor(Math.max(1, currentPage - 1))}
        aria-label="Faqja e mëparshme"
        aria-disabled={currentPage <= 1}
        className={cn(
          cellClass,
          "border-summit/15 text-summit/50 hover:border-summit/40 hover:text-summit",
          currentPage <= 1 && "pointer-events-none opacity-40",
        )}
      >
        ‹
      </Link>

      {pages.map((page) => {
        const isActive = page === currentPage;
        return (
          <Link
            key={page}
            href={hrefFor(page)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              cellClass,
              isActive
                ? "border-summit/40 bg-summit/10 text-summit"
                : "border-summit/15 text-summit/50 hover:border-summit/40 hover:text-summit",
            )}
          >
            {page}
          </Link>
        );
      })}

      <Link
        href={hrefFor(Math.min(totalPages, currentPage + 1))}
        aria-label="Faqja tjetër"
        aria-disabled={currentPage >= totalPages}
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
