"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { difficultyLabels, featureLabels, seasonLabels } from "@/lib/i18n/labels";
import { trailsParsers } from "@/lib/search-params/trails";
import { cn } from "@/lib/utils/cn";

const DIFFICULTIES = ["easy", "moderate", "hard", "expert"] as const;
const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
const FEATURES = [
  "waterfall",
  "lake",
  "summit",
  "forest",
  "historic",
  "canyon",
  "village",
] as const;

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function TrailFilters({ regions }: { regions: string[] }) {
  const [filters, setFilters] = useQueryStates(trailsParsers, {
    shallow: false,
    clearOnDefault: true,
  });
  const [openMobile, setOpenMobile] = useState(false);

  const activeCount =
    filters.difficulty.length +
    filters.season.length +
    filters.features.length +
    (filters.region ? 1 : 0) +
    (filters.search ? 1 : 0);

  function reset() {
    void setFilters({
      search: "",
      difficulty: [],
      region: "",
      season: [],
      features: [],
      page: 1,
    });
  }

  return (
    <div>
      {/* Mobile toggle */}
      <Button
        variant="outline"
        className="mb-4 w-full lg:hidden"
        onClick={() => setOpenMobile((v) => !v)}
      >
        <SlidersHorizontal />
        Filtrat
        {activeCount > 0 ? (
          <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>

      <div
        className={cn(
          "space-y-6 lg:block",
          openMobile ? "block" : "hidden",
        )}
      >
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="trail-search">Kërko</Label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="trail-search"
              className="h-9 pl-9"
              placeholder="Emri i shtegut…"
              defaultValue={filters.search}
              onChange={(e) =>
                setFilters(
                  { search: e.target.value, page: 1 },
                  { throttleMs: 400 },
                )
              }
            />
          </div>
        </div>

        {/* Difficulty */}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Vështirësia</legend>
          {DIFFICULTIES.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={filters.difficulty.includes(d)}
                onChange={() =>
                  setFilters({
                    difficulty: toggle(filters.difficulty, d),
                    page: 1,
                  })
                }
              />
              {difficultyLabels[d]}
            </label>
          ))}
        </fieldset>

        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="trail-region">Rajoni</Label>
          <select
            id="trail-region"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={filters.region}
            onChange={(e) => setFilters({ region: e.target.value, page: 1 })}
          >
            <option value="">Të gjitha rajonet</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* Season */}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Stina</legend>
          {SEASONS.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={filters.season.includes(s)}
                onChange={() =>
                  setFilters({ season: toggle(filters.season, s), page: 1 })
                }
              />
              {seasonLabels[s]}
            </label>
          ))}
        </fieldset>

        {/* Features */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Karakteristika</span>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => {
              const active = filters.features.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() =>
                    setFilters({
                      features: toggle(filters.features, f),
                      page: 1,
                    })
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {featureLabels[f]}
                </button>
              );
            })}
          </div>
        </div>

        {activeCount > 0 ? (
          <Button variant="ghost" className="w-full" onClick={reset}>
            <X />
            Pastro filtrat
          </Button>
        ) : null}
      </div>
    </div>
  );
}
