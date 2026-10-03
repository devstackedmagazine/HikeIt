"use client";

import { difficultyLabels } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils/cn";

export type Difficulty = "easy" | "moderate" | "hard" | "expert";

const DIFFICULTIES: { label: string; value: Difficulty; active: string }[] = [
  { label: "L", value: "easy", active: "border-moss bg-moss/20 text-moss" },
  {
    label: "M",
    value: "moderate",
    active: "border-alert bg-alert/20 text-alert",
  },
  {
    label: "V",
    value: "hard",
    active: "border-sunset bg-sunset/20 text-sunset",
  },
  {
    label: "E",
    value: "expert",
    active: "border-danger bg-danger/20 text-danger",
  },
];

export function DifficultySelector({
  value,
  onChange,
}: {
  value: Difficulty | undefined;
  onChange: (value: Difficulty) => void;
}) {
  return (
    <div className="flex gap-1">
      {DIFFICULTIES.map((d) => {
        const active = value === d.value;
        return (
          <button
            key={d.value}
            type="button"
            aria-pressed={active}
            aria-label={difficultyLabels[d.value]}
            onClick={() => onChange(d.value)}
            className={cn(
              "font-heading flex size-9 items-center justify-center border-2 text-[13px] font-extrabold uppercase transition-colors",
              active
                ? d.active
                : "border-summit/40 bg-summit/[0.06] text-summit/70 hover:text-summit",
            )}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}
