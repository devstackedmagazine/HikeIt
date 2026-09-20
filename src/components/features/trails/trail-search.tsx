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
    <div className="border-summit/40 bg-summit/[0.05] focus-within:border-moss flex h-[38px] w-full items-center gap-2.5 border px-3 sm:w-[260px]">
      <input
        type="search"
        aria-label="Kërko shtegun"
        placeholder="Kërko shtegun..."
        value={filters.search}
        onChange={(e) =>
          setFilters({ search: e.target.value, page: 1 }, { throttleMs: 400 })
        }
        className="text-summit placeholder:text-summit/35 min-w-0 flex-1 bg-transparent text-[13px] focus:outline-none"
      />
      <Search className="text-summit/35 size-4 shrink-0" />
    </div>
  );
}
