import { MapPin } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { CloudImage } from "@/components/features/images/cloud-image";
import type { Trail } from "@/lib/db/schema";
import { featureLabels } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils/cn";

/** Single-letter difficulty badge shown bottom-left on the cover. */
const DIFFICULTY_BADGE: Record<
  Trail["difficulty"],
  { letter: string; className: string }
> = {
  easy: { letter: "L", className: "bg-moss text-abyss" },
  moderate: { letter: "M", className: "bg-alert text-abyss" },
  hard: { letter: "V", className: "bg-sunset text-summit" },
  expert: { letter: "E", className: "bg-danger text-summit" },
};

function formatStats(trail: Trail) {
  const distanceKm = trail.distanceKm ? Number(trail.distanceKm) : null;
  const durationH =
    trail.estimatedDurationMin != null
      ? trail.estimatedDurationMin / 60
      : distanceKm != null
        ? Math.round((distanceKm / 3) * 10) / 10
        : null;

  return {
    distance: distanceKm != null ? distanceKm.toFixed(1) : null,
    elevation: trail.elevationGainM,
    duration: durationH != null ? durationH.toFixed(1) : null,
  };
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[8px] font-semibold tracking-widest text-summit/30 uppercase">
        {label}
      </p>
      <p className="font-heading text-[15px] font-extrabold whitespace-nowrap text-summit">
        {value} {unit}
      </p>
    </div>
  );
}

/** 1px vertical rule between stats. */
function StatDivider() {
  return <span className="w-px shrink-0 self-stretch bg-summit/10" />;
}

export function TrailCard({ trail }: { trail: Trail }) {
  const stats = formatStats(trail);
  const badge = DIFFICULTY_BADGE[trail.difficulty];
  const location = [trail.city, trail.region]
    .filter(Boolean)
    .join(", ")
    .toUpperCase();
  const features = (trail.features ?? []).slice(0, 3);

  const statEntries: { label: string; value: string | number; unit: string }[] = [];
  if (stats.distance) {
    statEntries.push({ label: "Distancë", value: stats.distance, unit: "KM" });
  }
  if (stats.elevation != null) {
    statEntries.push({ label: "Lartësia", value: stats.elevation, unit: "M" });
  }
  if (stats.duration) {
    statEntries.push({ label: "Koha", value: stats.duration, unit: "H" });
  }

  return (
    <div className="flex flex-col border border-summit/10 bg-summit/3">
      {/* Cover */}
      <div className="relative h-55 overflow-hidden">
        <CloudImage
          publicId={trail.coverImageUrl}
          size="thumbnail"
          alt={trail.name}
          fallback="trail"
          className="h-full w-full object-cover"
        />
        {trail.verified ? (
          <span className="absolute top-2 right-2 border border-moss bg-[rgba(13,31,20,0.85)] px-2 py-[3px] text-[9px] font-bold tracking-[0.08em] text-moss uppercase">
            ✓ Verifikuar
          </span>
        ) : null}
        <span
          className={cn(
            "absolute bottom-2 left-2 px-2 py-1 text-[10px] font-extrabold tracking-[0.06em] uppercase",
            badge.className,
          )}
        >
          {badge.letter}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading mb-1.5 text-[15px] leading-[1.2] font-extrabold tracking-[-0.01em] text-summit uppercase">
          {trail.name}
        </h3>

        {location ? (
          <p className="mb-4 flex items-center gap-1 text-[10px] font-semibold tracking-[0.06em] text-moss uppercase">
            <MapPin className="size-3 shrink-0" />
            {location}
          </p>
        ) : null}

        {statEntries.length > 0 ? (
          <div className="mb-3.5 flex items-stretch gap-3 border-t border-summit/8 pt-3">
            {statEntries.map((stat, i) => (
              <Fragment key={stat.label}>
                {i > 0 ? <StatDivider /> : null}
                <Stat label={stat.label} value={stat.value} unit={stat.unit} />
              </Fragment>
            ))}
          </div>
        ) : null}

        {features.length > 0 ? (
          <div className="mt-auto mb-3.5 flex flex-wrap gap-1.5">
            {features.map((feature) => (
              <span
                key={feature}
                className="border border-summit/12 bg-summit/[0.06] px-2 py-[3px] text-[9px] font-semibold tracking-[0.06em] text-summit/55 uppercase"
              >
                {featureLabels[feature] ?? feature}
              </span>
            ))}
          </div>
        ) : null}

        <Link
          href={`/trails/${trail.slug}`}
          className="mt-auto block border border-moss/35 bg-moss/15 px-0 py-2.75 text-center text-[11px] font-bold tracking-widest text-moss uppercase transition-colors hover:border-moss/50 hover:bg-moss/20"
        >
          Shiko Shtegun →
        </Link>
      </div>
    </div>
  );
}
