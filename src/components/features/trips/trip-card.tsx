import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";

import { CloudImage } from "@/components/features/images/cloud-image";
import type { Trip } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";
import type { TripWithClub } from "@/server/queries/trips";

const DIFFICULTY: Record<
  NonNullable<Trip["difficulty"]>,
  { label: string; bar: string; badge: string }
> = {
  easy: { label: "Lehtë", bar: "bg-moss", badge: "bg-moss text-abyss" },
  moderate: { label: "Moderat", bar: "bg-alert", badge: "bg-alert text-abyss" },
  hard: { label: "Vështirë", bar: "bg-sunset", badge: "bg-sunset text-summit" },
  expert: { label: "Ekstreme", bar: "bg-danger", badge: "bg-danger text-summit" },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(date)
    .toUpperCase();
}

function spots(trip: TripWithClub) {
  if (trip.maxParticipants === null) {
    return { label: "VENDE TË LIRA", pct: 0, color: "bg-moss", full: false };
  }
  const ratio =
    trip.maxParticipants > 0 ? trip.confirmedCount / trip.maxParticipants : 0;
  if (ratio >= 1) {
    return { label: "PLOTË", pct: 100, color: "bg-danger", full: true };
  }
  return {
    label: `${trip.confirmedCount}/${trip.maxParticipants} VENDE`,
    pct: Math.round(ratio * 100),
    color: ratio < 0.5 ? "bg-moss" : ratio < 0.8 ? "bg-alert" : "bg-danger",
    full: false,
  };
}

export function TripCard({ trip }: { trip: TripWithClub }) {
  const free = Number(trip.priceEur) === 0;
  const diff = trip.difficulty ? DIFFICULTY[trip.difficulty] : null;
  const barColor = free || !diff ? "bg-moss" : diff.bar;
  const s = spots(trip);
  const location = [trip.club.city, "Kosovë"]
    .filter(Boolean)
    .join(", ")
    .toUpperCase();

  return (
    <div className="flex flex-col overflow-hidden border border-summit/[0.08] bg-summit/[0.03]">
      {/* Top difficulty accent */}
      <div className={cn("h-[3px] w-full", barColor)} />

      {/* Club row */}
      <div className="flex items-center gap-1.5 border-b border-summit/[0.06] bg-summit/[0.03] px-3 py-2">
        <span className="flex size-4 items-center justify-center rounded-full bg-moss/20 text-[8px] font-bold text-moss">
          {trip.club.name?.charAt(0).toUpperCase() ?? "?"}
        </span>
        <span className="truncate text-[10px] font-semibold tracking-[0.06em] text-summit/50 uppercase">
          {trip.club.name}
        </span>
      </div>

      {/* Image */}
      <div className="relative h-[140px] overflow-hidden">
        <CloudImage
          publicId={trip.coverImageUrl}
          size="cover"
          alt={`${trip.title} — udhëtim alpin i organizuar nga ${trip.club.name}, Kosovë`}
          fallback="trip"
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,31,20,0.8)] to-transparent" />
        {diff ? (
          <span
            className={cn(
              "absolute top-2 right-2 px-2 py-[3px] text-[9px] font-extrabold tracking-[0.08em] uppercase",
              diff.badge,
            )}
          >
            {diff.label}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-3 pt-3">
        <h3 className="font-heading mb-2.5 line-clamp-2 text-[14px] leading-[1.2] font-extrabold tracking-[-0.01em] text-summit uppercase">
          {trip.title}
        </h3>

        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.04em] text-summit/45 uppercase">
          <Calendar className="size-[11px] text-summit/35" />
          {formatDate(trip.startDatetime)}
        </p>
        {location ? (
          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.04em] text-summit/45 uppercase">
            <MapPin className="size-[11px] text-summit/35" />
            {location}
          </p>
        ) : null}

        <div className="mb-2.5 h-px w-full bg-summit/[0.06]" />

        {/* Spots */}
        <div className="mb-2">
          <span
            className={cn(
              "mb-1 block text-[9px] font-semibold tracking-[0.06em] uppercase",
              s.full ? "text-danger" : "text-summit/40",
            )}
          >
            {s.label}
          </span>
          <div className="h-[3px] w-full bg-summit/[0.08]">
            <div className={cn("h-full", s.color)} style={{ width: `${s.pct}%` }} />
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          {free ? (
            <span className="font-heading text-[20px] font-extrabold tracking-[-0.01em] text-moss uppercase">
              Falas
            </span>
          ) : (
            <span className="font-heading text-[20px] font-extrabold tracking-[-0.02em] text-summit">
              €{Number(trip.priceEur)}
            </span>
          )}
        </div>

        <Link
          href={`/trips/${trip.slug}`}
          className="mt-auto block border border-moss/25 bg-moss/10 py-2.5 text-center text-[10px] font-bold tracking-[0.1em] text-moss uppercase transition-colors hover:border-moss/45 hover:bg-moss/20"
        >
          Shiko Udhëtimin →
        </Link>
      </div>
    </div>
  );
}
