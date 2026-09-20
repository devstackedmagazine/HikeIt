"use client";

import { Search } from "lucide-react";
import { useQueryStates } from "nuqs";

import { clubsParsers } from "@/lib/search-params/clubs";
import { cn } from "@/lib/utils/cn";

const CITIES = [
  "Prishtinë",
  "Pejë",
  "Prizren",
  "Gjakovë",
  "Gjilan",
  "Mitrovicë",
];

/** Prominent white search box for the light header. */
export function ClubSearch() {
  const [filters, setFilters] = useQueryStates(clubsParsers, {
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="border-forest/60 bg-summit focus-within:border-forest flex h-16 w-full max-w-[500px] items-center gap-2.5 border px-3.5">
      <input
        type="search"
        aria-label="Kërko klubet"
        placeholder="Kërko klubet sipas emrit ose qytetit..."
        value={filters.search}
        onChange={(e) =>
          setFilters({ search: e.target.value, page: 1 }, { throttleMs: 300 })
        }
        className="text-forest placeholder:text-forest/35 min-w-0 flex-1 bg-transparent text-[13px] focus:outline-none"
      />
      <Search className="text-forest/40 size-[18px] shrink-0" />
    </div>
  );
}

/** Dark band of city filter tabs. */
export function ClubCityTabs() {
  const [filters, setFilters] = useQueryStates(clubsParsers, {
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="scrollbar-hide flex h-full items-center gap-1 overflow-x-auto">
      <CityTab
        label="Të gjitha"
        active={filters.city === ""}
        onClick={() => setFilters({ city: "", page: 1 })}
      />
      {CITIES.map((city) => (
        <CityTab
          key={city}
          label={city}
          active={filters.city === city}
          onClick={() => setFilters({ city, page: 1 })}
        />
      ))}
    </div>
  );
}

function CityTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 shrink-0 items-center px-4 text-[11px] whitespace-nowrap uppercase transition-colors",
        active
          ? "border-moss/50 bg-moss/25 text-moss border font-bold tracking-[0.08em]"
          : "text-summit/45 hover:text-summit/80 font-semibold tracking-[0.06em]",
      )}
    >
      {label}
    </button>
  );
}
