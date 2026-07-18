import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  hint,
  accent = "moss",
}: {
  /** Accepted for call-site compatibility; not rendered in the flat design. */
  icon?: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  /** Money stats use "sunset" per the design system; everything else "moss". */
  accent?: "moss" | "sunset";
}) {
  return (
    <div className="border border-forest/12 bg-summit p-4">
      <p
        className={cn(
          "font-heading text-2xl font-extrabold tracking-[-0.02em]",
          accent === "sunset" ? "text-sunset" : "text-forest",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[9px] font-semibold tracking-[0.12em] text-forest/40 uppercase">
        {label}
      </p>
      {hint ? (
        <p
          className={cn(
            "mt-0.5 text-[9px] font-semibold uppercase",
            accent === "sunset" ? "text-sunset/70" : "text-moss",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
