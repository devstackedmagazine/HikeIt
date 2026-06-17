import { Map as MapIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  createSearchParamsCache,
  createSerializer,
  type SearchParams,
} from "nuqs/server";
import { Suspense } from "react";

import { TrailCard } from "@/components/features/trails/trail-card";
import { TrailGridSkeleton } from "@/components/features/trails/trail-card-skeleton";
import { TrailFilters } from "@/components/features/trails/trail-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { Trail } from "@/lib/db/schema";
import { trailsParsers } from "@/lib/search-params/trails";
import { getTrailRegions, getTrails } from "@/server/queries/trails";

export const metadata: Metadata = {
  title: "Shtigje",
  description:
    "Shfleto shtigjet malore të verifikuara në Kosovë — filtro sipas vështirësisë, rajonit dhe stinës.",
  alternates: { canonical: "https://hikeit.app/trails" },
};

const cache = createSearchParamsCache(trailsParsers);
const serialize = createSerializer(trailsParsers);
const LIMIT = 12;

type ParsedFilters = Awaited<ReturnType<typeof cache.parse>>;

async function TrailResults({ filters }: { filters: ParsedFilters }) {
  const { trails, total, hasMore } = await getTrails({
    search: filters.search || undefined,
    difficulty: filters.difficulty as Trail["difficulty"][],
    region: filters.region || undefined,
    season: filters.season,
    features: filters.features,
    page: filters.page,
    limit: LIMIT,
  });

  if (trails.length === 0) {
    return (
      <EmptyState
        icon={MapIcon}
        title="Asnjë shteg nuk u gjet"
        description="Provoni të ndryshoni filtrat ose pastrojini ato."
      />
    );
  }

  const prevHref = serialize({ ...filters, page: filters.page - 1 });
  const nextHref = serialize({ ...filters, page: filters.page + 1 });

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trails.map((trail) => (
          <TrailCard key={trail.id} trail={trail} />
        ))}
      </div>

      {(filters.page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            disabled={filters.page <= 1}
            render={<Link href={`/trails${prevHref}`} />}
          >
            E mëparshme
          </Button>
          <span className="text-sm text-muted-foreground">
            Faqja {filters.page} · {total} shtigje
          </span>
          <Button
            variant="outline"
            disabled={!hasMore}
            render={<Link href={`/trails${nextHref}`} />}
          >
            Tjetra
          </Button>
        </div>
      )}
    </div>
  );
}

export default async function TrailsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await cache.parse(searchParams);
  const regions = await getTrailRegions();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Shtigjet e Kosovës
        </h1>
        <p className="mt-2 text-muted-foreground">
          Zbulo shtigje malore të verifikuara, filtruar sipas nevojës tënde.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <TrailFilters regions={regions} />
        </aside>

        <Suspense
          key={JSON.stringify(filters)}
          fallback={<TrailGridSkeleton count={LIMIT} />}
        >
          <TrailResults filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
