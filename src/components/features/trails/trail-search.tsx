"use client";

import { Search } from "lucide-react";
import { useQueryStates } from "nuqs";

import { trailsParsers } from "@/lib/search-params/trails";

/** Header search box for the trails listing. Writes `search` to the URL. */
export function TrailSearch() {
  const [filters, setFilters] = useQueryStates(trailsParsers, {
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="flex h-[38px] w-full items-center gap-2.5 border border-summit/15 bg-summit/[0.05] px-3 focus-within:border-moss/50 sm:w-[260px]">
      <input
        type="search"
        aria-label="Kërko shtegun"
        placeholder="Kërko shtegun..."
        value={filters.search}
        onChange={(e) =>
          setFilters({ search: e.target.value, page: 1 }, { throttleMs: 400 })
        }
        className="min-w-0 flex-1 bg-transparent text-[13px] text-summit placeholder:text-summit/35 focus:outline-none"
      />
      <Search className="size-4 shrink-0 text-summit/35" />
    </div>
  );
}
