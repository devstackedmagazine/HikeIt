"use client";

import { Check } from "lucide-react";
import { useQueryStates } from "nuqs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tripsParsers } from "@/lib/search-params/trips";
import { cn } from "@/lib/utils/cn";

const ALL_VALUE = "all";

const DATE_TABS: { value: string; label: string }[] = [
  { value: "week", label: "Këtë javë" },
  { value: "month", label: "Këtë muaj" },
  { value: "quarter", label: "3 muajt e ardhshëm" },
];

const DIFFICULTIES: [string, string][] = [
  ["easy", "E lehtë"],
  ["moderate", "E mesme"],
  ["hard", "E vështirë"],
  ["expert", "Ekspert"],
];

function SelectChip({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  allLabel: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || ALL_VALUE}
      onValueChange={(v) => onChange(!v || v === ALL_VALUE ? "" : v)}
    >
      <SelectTrigger
        aria-label={label}
        className="h-9 justify-between gap-1.5 border-summit/20 bg-transparent px-3.5 text-[11px] font-semibold tracking-[0.06em] text-summit/70 uppercase hover:bg-transparent focus-visible:border-moss/50 focus-visible:ring-0 data-[size=default]:h-9"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-summit/70">{label}:</span>
          <SelectValue>
            {(v: string) =>
              v === ALL_VALUE
                ? allLabel
                : (options.find(([optValue]) => optValue === v)?.[1] ?? v)
            }
          </SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent className="z-50 border border-forest bg-forest text-summit/70">
        <SelectItem
          value={ALL_VALUE}
          className={cn(
            "text-[11px] tracking-[0.06em] uppercase focus:bg-moss/15 focus:text-moss",
            value === "" && "text-moss",
          )}
        >
          {allLabel}
        </SelectItem>
        {options.map(([v, l]) => (
          <SelectItem
            key={v}
            value={v}
            className={cn(
              "text-[11px] tracking-[0.06em] uppercase focus:bg-moss/15 focus:text-moss",
              value === v && "text-moss",
            )}
          >
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TripFilters({ regions }: { regions: string[] }) {
  const [filters, setFilters] = useQueryStates(tripsParsers, {
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date range tabs */}
      <div className="flex">
        {DATE_TABS.map((tab, i) => {
          const active = filters.dateRange === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() =>
                setFilters({ dateRange: active ? "" : tab.value, page: 1 })
              }
              className={cn(
                "flex h-9 items-center border px-3.5 text-[11px] tracking-[0.06em] uppercase transition-colors",
                i > 0 && "-ml-px",
                active
                  ? "z-10 border-summit/35 bg-summit/[0.12] font-bold text-summit"
                  : "border-summit/15 font-semibold text-summit/45 hover:border-summit/30 hover:text-summit/70",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <SelectChip
        label="Rajoni"
        value={filters.region}
        allLabel="Të gjitha"
        options={regions.map((r) => [r, r])}
        onChange={(v) => setFilters({ region: v, page: 1 })}
      />

      <SelectChip
        label="Vështirësia"
        value={filters.difficulty}
        allLabel="Të gjithë"
        options={DIFFICULTIES}
        onChange={(v) => setFilters({ difficulty: v, page: 1 })}
      />

      <label className="flex h-9 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          className="sr-only"
          checked={filters.free === "1"}
          onChange={() =>
            setFilters({ free: filters.free === "1" ? "" : "1", page: 1 })
          }
        />
        <span
          className={cn(
            "flex size-[14px] items-center justify-center border",
            filters.free === "1" ? "border-moss bg-moss" : "border-summit/30",
          )}
        >
          {filters.free === "1" ? (
            <Check className="size-2.5 text-abyss" strokeWidth={3} />
          ) : null}
        </span>
        <span className="text-[11px] font-semibold tracking-[0.06em] text-summit/55 uppercase">
          Vetëm falas
        </span>
      </label>
    </div>
  );
}
