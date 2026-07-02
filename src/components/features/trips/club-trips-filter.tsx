"use client";

import { ChevronDown } from "lucide-react";
import { useQueryStates } from "nuqs";

import { clubTripsParsers } from "@/lib/search-params/club-trips";

const STATUS_OPTIONS: [string, string][] = [
  ["", "Të gjitha"],
  ["open", "Hapur"],
  ["draft", "Draft"],
  ["completed", "Përfunduar"],
  ["canceled", "Anuluar"],
];

/** Status dropdown for the club trips table (writes `status` + resets page). */
export function ClubTripsFilter() {
  const [filters, setFilters] = useQueryStates(clubTripsParsers, {
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold tracking-[0.1em] text-forest/40 uppercase">
        Filtro:
      </span>
      <div className="relative">
        <select
          aria-label="Filtro sipas statusit"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
          className="h-8 appearance-none border border-forest/20 bg-summit pr-7 pl-3 text-[11px] font-semibold text-forest uppercase focus:border-forest/50 focus:outline-none"
        >
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-forest/40" />
      </div>
    </div>
  );
}
