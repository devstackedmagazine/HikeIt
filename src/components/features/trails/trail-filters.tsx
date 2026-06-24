"use client";

import { Check, ChevronDown } from "lucide-react";
import { useQueryStates } from "nuqs";

import {
  difficultyLabels,
  featureLabels,
  seasonLabels,
} from "@/lib/i18n/labels";
import { trailsParsers } from "@/lib/search-params/trails";
import { cn } from "@/lib/utils/cn";

const DIFFICULTIES = ["easy", "moderate", "hard", "expert"] as const;
const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
const FEATURES = [
  "waterfall",
  "lake",
  "summit",
  "forest",
  "canyon",
  "historic",
] as const;

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function FilterCheckbox({
  checked,
  onChange,
  label,
  labelClassName,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  labelClassName?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        className={cn(
          "flex size-[14px] shrink-0 items-center justify-center border",
          checked ? "border-moss bg-moss" : "border-summit/25",
        )}
      >
        {checked ? (
          <Check className="size-2.5 text-abyss" strokeWidth={3} />
        ) : null}
      </span>
      <span
        className={cn(
          "font-medium tracking-[0.04em] text-summit/70 uppercase",
          labelClassName,
        )}
      >
        {label}
      </span>
    </label>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-2.5 text-[10px] font-bold tracking-[0.12em] text-summit/40 uppercase">
      {children}
    </p>
  );
}

export function TrailFilters({ regions }: { regions: string[] }) {
  const [filters, setFilters] = useQueryStates(trailsParsers, {
    shallow: false,
    clearOnDefault: true,
  });

  const hasActive =
    filters.difficulty.length > 0 ||
    filters.season.length > 0 ||
    filters.features.length > 0 ||
    filters.region !== "" ||
    filters.search !== "";

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
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[0.1em] text-summit uppercase">
          Filtro
        </span>
        {hasActive ? (
          <button
            type="button"
            onClick={reset}
            className="text-[10px] font-medium tracking-[0.08em] text-moss uppercase transition-opacity hover:opacity-70"
          >
            Pastro
          </button>
        ) : null}
      </div>

      {/* Difficulty */}
      <fieldset className="mb-5">
        <SectionLabel>Vështirësia</SectionLabel>
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map((d) => (
            <FilterCheckbox
              key={d}
              checked={filters.difficulty.includes(d)}
              onChange={() =>
                setFilters({
                  difficulty: toggle(filters.difficulty, d),
                  page: 1,
                })
              }
              label={difficultyLabels[d] ?? d}
              labelClassName="text-[12px]"
            />
          ))}
        </div>
      </fieldset>

      {/* Region */}
      <div className="mb-5">
        <SectionLabel>Rajoni</SectionLabel>
        <div className="relative">
          <select
            aria-label="Rajoni"
            value={filters.region}
            onChange={(e) => setFilters({ region: e.target.value, page: 1 })}
            className="h-9 w-full appearance-none border border-summit/20 bg-summit/[0.05] px-3 pr-8 text-[12px] font-medium text-summit outline-none focus:border-moss/50"
          >
            <option value="">TË GJITHA</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-summit/40" />
        </div>
      </div>

      {/* Season */}
      <fieldset className="mb-5">
        <SectionLabel>Stina</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {SEASONS.map((s) => (
            <FilterCheckbox
              key={s}
              checked={filters.season.includes(s)}
              onChange={() =>
                setFilters({ season: toggle(filters.season, s), page: 1 })
              }
              label={(seasonLabels[s] ?? s).toUpperCase()}
              labelClassName="text-[11px]"
            />
          ))}
        </div>
      </fieldset>

      {/* Features */}
      <div>
        <SectionLabel>Veçoritë</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {FEATURES.map((f) => {
            const active = filters.features.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() =>
                  setFilters({ features: toggle(filters.features, f), page: 1 })
                }
                className={cn(
                  "border px-2.5 py-[5px] text-[10px] font-semibold tracking-[0.06em] uppercase transition-colors",
                  active
                    ? "border-moss bg-moss text-abyss"
                    : "border-summit/15 bg-summit/[0.06] text-summit/60 hover:border-summit/30",
                )}
              >
                {featureLabels[f] ?? f}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
