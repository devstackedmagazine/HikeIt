import { Calendar, Mountain, Users } from "lucide-react";
import Link from "next/link";

import type { ClubWithStats } from "@/server/queries/clubs";

/** "1.2K" for ≥1000, otherwise the plain integer. */
function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

export function ClubCard({ club }: { club: ClubWithStats }) {
  const location = [
    club.city?.toUpperCase(),
    club.foundedYear ? `THEMELUAR ${club.foundedYear}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col overflow-hidden bg-pine">
      {/* Cover block (solid colour, not a photo) + overlapping circular logo */}
      <div className="relative h-[120px] bg-forest">
        <div className="absolute -bottom-4 left-3.5 z-10 flex size-9 items-center justify-center rounded-full border-2 border-moss bg-abyss text-moss">
          <Mountain className="size-[18px]" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-3.5 pt-7 pb-3.5">
        <h3 className="font-heading text-base font-extrabold tracking-[-0.01em] text-summit uppercase">
          {club.name}
        </h3>
        {location ? (
          <p className="mt-1 text-[9px] font-semibold tracking-[0.08em] text-moss uppercase">
            {location}
          </p>
        ) : null}

        {club.description ? (
          <p className="mt-2.5 line-clamp-2 text-xs leading-[1.6] text-summit/60">
            {club.description}
          </p>
        ) : null}

        <div className="mt-3.5 h-px w-full bg-summit/10" />

        <div className="mt-3 mb-3.5 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.04em] text-summit/60 uppercase">
            <Users className="size-3 text-summit/40" />
            {formatCount(club.memberCount)} Anëtarë
          </span>
          <span aria-hidden className="h-2.5 w-px bg-summit/15" />
          <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.04em] text-summit/60 uppercase">
            <Calendar className="size-3 text-summit/40" />
            {club.upcomingTripsCount} Udhëtime
          </span>
        </div>

        <Link
          href={`/clubs/${club.slug}`}
          className="mt-auto block border border-moss/30 bg-moss/15 py-2.5 text-center text-[11px] font-bold tracking-[0.1em] text-moss uppercase transition-colors hover:border-moss/50 hover:bg-moss/25"
        >
          Shiko Klubin →
        </Link>
      </div>
    </div>
  );
}
