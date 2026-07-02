"use client";

import { useState, useTransition } from "react";

import { cn } from "@/lib/utils/cn";
import { updatePreferences } from "@/server/actions/profile";

type Language = "sq" | "en";

export function LanguageToggle({ initial }: { initial: Language | undefined }) {
  const [value, setValue] = useState<Language>(initial ?? "sq");
  const [, startTransition] = useTransition();

  function select(next: Language) {
    setValue(next);
    startTransition(() => {
      void updatePreferences({ language: next });
    });
  }

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold tracking-[0.1em] text-summit/40 uppercase">
        Gjuha
      </p>
      <div className="flex gap-1">
        {(["sq", "en"] as const).map((lang) => {
          const active = value === lang;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => select(lang)}
              className={cn(
                "border px-3.5 py-1.5 text-[10px] font-bold tracking-[0.06em] uppercase transition-colors",
                active
                  ? "border-moss/40 bg-moss/20 text-moss"
                  : "border-summit/12 bg-summit/[0.05] text-summit/35 hover:text-summit/60",
              )}
            >
              {lang}
            </button>
          );
        })}
      </div>
    </div>
  );
}
