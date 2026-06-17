"use client";

import { useQueryStates } from "nuqs";

import { difficultyLabels } from "@/lib/i18n/labels";
import { tripsParsers } from "@/lib/search-params/trips";
import { cn } from "@/lib/utils/cn";

const DATE_RANGES = [
  { value: "week", label: "Këtë javë" },
  { value: "month", label: "Këtë muaj" },
  { value: "quarter", label: "3 muajt e ardhshëm" },
];
const DIFFICULTIES = ["easy", "moderate", "hard", "expert"] as const;

export function TripFilters({
  regions,
  clubs,
}: {
  regions: string[];
  clubs: { slug: string; name: string }[];
}) {
  const [filters, setFilters] = useQueryStates(tripsParsers, {
    shallow: false,
    clearOnDefault: true,
  });

  const selectClass =
    "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={selectClass}
        value={filters.dateRange}
        onChange={(e) => setFilters({ dateRange: e.target.value, page: 1 })}
      >
        <option value="">Çdo datë</option>
        {DATE_RANGES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.difficulty}
        onChange={(e) => setFilters({ difficulty: e.target.value, page: 1 })}
      >
        <option value="">Çdo vështirësi</option>
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d}>
            {difficultyLabels[d]}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.club}
        onChange={(e) => setFilters({ club: e.target.value, page: 1 })}
      >
        <option value="">Çdo klub</option>
        {clubs.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={filters.region}
        onChange={(e) => setFilters({ region: e.target.value, page: 1 })}
      >
        <option value="">Çdo rajon</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() =>
          setFilters({ free: filters.free === "1" ? "" : "1", page: 1 })
        }
        className={cn(
          "rounded-full border px-3 py-1.5 text-sm transition-colors",
          filters.free === "1"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:bg-muted",
        )}
      >
        Vetëm falas
      </button>
    </div>
  );
}
