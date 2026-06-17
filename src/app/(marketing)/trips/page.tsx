import { Calendar } from "lucide-react";
import type { Metadata } from "next";
import { createSearchParamsCache, type SearchParams } from "nuqs/server";
import { Suspense } from "react";

import { TripCard } from "@/components/features/trips/trip-card";
import { TripFilters } from "@/components/features/trips/trip-filters";
import { EmptyState } from "@/components/shared/empty-state";
import type { Trip } from "@/lib/db/schema";
import { tripsParsers } from "@/lib/search-params/trips";
import { getClubs } from "@/server/queries/clubs";
import { getTrailRegions } from "@/server/queries/trails";
import { getPublicTrips } from "@/server/queries/trips";

export const metadata: Metadata = {
  title: "Udhëtime",
  description: "Gjej dhe rezervo udhëtime malore të organizuara nga klubet.",
  alternates: { canonical: "https://hikeit.app/trips" },
};

const cache = createSearchParamsCache(tripsParsers);
type ParsedFilters = Awaited<ReturnType<typeof cache.parse>>;

function dateRange(v: string): "week" | "month" | "quarter" | undefined {
  return v === "week" || v === "month" || v === "quarter" ? v : undefined;
}

async function TripResults({ filters }: { filters: ParsedFilters }) {
  const { trips } = await getPublicTrips({
    difficulty: (filters.difficulty || undefined) as Trip["difficulty"],
    region: filters.region || undefined,
    clubSlug: filters.club || undefined,
    dateRange: dateRange(filters.dateRange),
    freeOnly: filters.free === "1",
    page: filters.page,
  });

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Asnjë udhëtim"
        description="Nuk ka udhëtime që përputhen. Provo filtra të tjerë."
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await cache.parse(searchParams);
  const [regions, clubsResult] = await Promise.all([
    getTrailRegions(),
    getClubs({ limit: 100 }),
  ]);
  const clubs = clubsResult.clubs.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Udhëtimet e Ardhshme
        </h1>
        <p className="mt-2 text-muted-foreground">
          Bashkohu me aventurën tjetër të organizuar nga klubet.
        </p>
      </div>

      <div className="mb-8">
        <TripFilters regions={regions} clubs={clubs} />
      </div>

      <Suspense
        key={JSON.stringify(filters)}
        fallback={<p className="text-sm text-muted-foreground">Duke ngarkuar…</p>}
      >
        <TripResults filters={filters} />
      </Suspense>
    </div>
  );
}
