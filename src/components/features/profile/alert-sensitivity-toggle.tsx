"use client";

import { useState, useTransition } from "react";

import { cn } from "@/lib/utils/cn";
import { updatePreferences } from "@/server/actions/profile";

type Sensitivity = "low" | "medium" | "high";

const OPTIONS: { value: Sensitivity; label: string }[] = [
  { value: "low", label: "E ulët" },
  { value: "medium", label: "Mesme" },
  { value: "high", label: "E lartë" },
];

export function AlertSensitivityToggle({
  initial,
}: {
  initial: Sensitivity | undefined;
}) {
  const [value, setValue] = useState<Sensitivity>(initial ?? "low");
  const [, startTransition] = useTransition();

  function select(next: Sensitivity) {
    setValue(next);
    startTransition(() => {
      void updatePreferences({ alertSensitivity: next });
    });
  }

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold tracking-[0.1em] text-summit/40 uppercase">
        Ndjeshmëria e alerteve
      </p>
      <div className="flex gap-1">
        {OPTIONS.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => select(o.value)}
              className={cn(
                "border px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.06em] uppercase transition-colors",
                active
                  ? "border-moss/40 bg-moss/20 text-moss"
                  : "border-summit/12 bg-summit/[0.05] text-summit/35 hover:text-summit/60",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
