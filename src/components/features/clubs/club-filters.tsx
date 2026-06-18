"use client";

import { Search } from "lucide-react";
import { useQueryStates } from "nuqs";

import { Input } from "@/components/ui/input";
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

export function ClubFilters() {
  const [filters, setFilters] = useQueryStates(clubsParsers, {
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 pl-9"
          placeholder="Kërko klube…"
          value={filters.search}
          onChange={(e) =>
            setFilters({ search: e.target.value, page: 1 }, { throttleMs: 400 })
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
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
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
