import { Calendar, Map, Search, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { globalSearch, type SearchResult } from "@/server/queries/search";

export const metadata: Metadata = { title: "Kërko" };

const SECTION = {
  trails: { heading: "Shtigjet", icon: Map, base: "/trails" },
  clubs: { heading: "Klubet", icon: Users, base: "/clubs" },
  trips: { heading: "Udhëtimet", icon: Calendar, base: "/trips" },
} as const;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await globalSearch(q, 20);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Rezultatet e kërkimit
      </h1>
      {q ? (
        <p className="mt-1 text-muted-foreground">
          {results.total} rezultate për “{q}”
        </p>
      ) : null}

      {q.trim().length < 2 ? (
        <p className="mt-8 text-muted-foreground">
          Shkruani të paktën 2 karaktere për të kërkuar.
        </p>
      ) : results.total === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Search}
            title={`Asnjë rezultat për “${q}”`}
            description="Provoni terma të tjerë kërkimi."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {(["trails", "clubs", "trips"] as const).map((key) => {
            const items = results[key];
            if (items.length === 0) return null;
            const { heading, icon: Icon, base } = SECTION[key];
            return (
              <section key={key}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <Icon className="size-5 text-primary" />
                  {heading}
                </h2>
                <div className="space-y-2">
                  {items.map((item: SearchResult) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={`${base}/${item.slug}`}
                      className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.subtitle}
                        </p>
                      </div>
                      {item.metadata.difficulty ? (
                        <span className="text-xs text-muted-foreground">
                          {item.metadata.difficulty}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
