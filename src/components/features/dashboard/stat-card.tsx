import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
}: {
  /** Accepted for call-site compatibility; not rendered in the flat design. */
  icon?: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="border border-forest/12 bg-summit p-4">
      <p className="font-heading text-2xl font-extrabold tracking-[-0.02em] text-forest">
        {value}
      </p>
      <p className="mt-1 text-[9px] font-semibold tracking-[0.12em] text-forest/40 uppercase">
        {label}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[9px] font-semibold text-moss uppercase">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
