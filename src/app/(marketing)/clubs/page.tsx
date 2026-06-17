import { Users } from "lucide-react";
import type { Metadata } from "next";
import {
  createSearchParamsCache,
  type SearchParams,
} from "nuqs/server";
import { Suspense } from "react";

import { ClubCard } from "@/components/features/clubs/club-card";
import { ClubFilters } from "@/components/features/clubs/club-filters";
import { EmptyState } from "@/components/shared/empty-state";
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

type ParsedFilters = Awaited<ReturnType<typeof cache.parse>>;

async function ClubResults({ filters }: { filters: ParsedFilters }) {
  const { clubs } = await getClubs({
    search: filters.search || undefined,
    city: filters.city || undefined,
    page: filters.page,
    limit: LIMIT,
  });

  if (clubs.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Asnjë klub ende"
        description="Klubet e para po vijnë së shpejti. Bëhu i pari që regjistron klubin tënd."
        action={{ label: "Regjistro klubin", href: "/register?type=club" }}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {clubs.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  );
}

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await cache.parse(searchParams);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Klubet e Alpinizmit
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gjej komunitetin tënd të alpinizmit.
        </p>
      </div>

      <div className="mb-8">
        <ClubFilters />
      </div>

      <Suspense
        key={JSON.stringify(filters)}
        fallback={
          <p className="text-sm text-muted-foreground">Duke ngarkuar…</p>
        }
      >
        <ClubResults filters={filters} />
      </Suspense>
    </div>
  );
}
