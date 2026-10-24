import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";

import { CloudImage } from "@/components/features/images/cloud-image";
import type { Trip } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";
import { APP_TIME_ZONE } from "@/lib/utils/datetime";
import type { TripWithClub } from "@/server/queries/trips";

const DIFFICULTY: Record<
  NonNullable<Trip["difficulty"]>,
  { label: string; bar: string; badge: string }
> = {
  easy: { label: "Lehtë", bar: "bg-moss", badge: "bg-moss text-abyss" },
  moderate: { label: "Moderat", bar: "bg-alert", badge: "bg-alert text-abyss" },
  hard: { label: "Vështirë", bar: "bg-sunset", badge: "bg-sunset text-summit" },
  expert: {
    label: "Ekstreme",
    bar: "bg-danger",
    badge: "bg-danger text-summit",
  },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    timeZone: APP_TIME_ZONE,
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
    <div className="border-summit/[0.08] bg-summit/[0.03] flex flex-col overflow-hidden border">
      {/* Top difficulty accent */}
      <div className={cn("h-[3px] w-full", barColor)} />

      {/* Club row */}
      <div className="border-summit/[0.06] bg-summit/[0.03] flex items-center gap-1.5 border-b px-3 py-2">
        <span className="bg-moss/20 text-moss flex size-4 items-center justify-center rounded-full text-[8px] font-bold">
          {trip.club.name?.charAt(0).toUpperCase() ?? "?"}
        </span>
        <span className="text-summit/50 truncate text-[10px] font-semibold tracking-[0.06em] uppercase">
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
        <h3 className="font-heading text-summit mb-2.5 line-clamp-2 text-[14px] leading-[1.2] font-extrabold tracking-[-0.01em] uppercase">
          {trip.title}
        </h3>

        <p className="text-summit/45 mb-1.5 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.04em] uppercase">
          <Calendar className="text-summit/35 size-[11px]" />
          {formatDate(trip.startDatetime)}
        </p>
        {location ? (
          <p className="text-summit/45 mb-3 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.04em] uppercase">
            <MapPin className="text-summit/35 size-[11px]" />
            {location}
          </p>
        ) : null}

        <div className="bg-summit/[0.06] mb-2.5 h-px w-full" />

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
          <div className="bg-summit/[0.08] h-[3px] w-full">
            <div
              className={cn("h-full", s.color)}
              style={{ width: `${s.pct}%` }}
            />
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          {free ? (
            <span className="font-heading text-moss text-[20px] font-extrabold tracking-[-0.01em] uppercase">
              Falas
            </span>
          ) : (
            <span className="font-heading text-summit text-[20px] font-extrabold tracking-[-0.02em]">
              €{Number(trip.priceEur)}
            </span>
          )}
        </div>

        <Link
          href={`/trips/${trip.slug}`}
          className="border-moss/25 bg-moss/10 text-moss hover:border-moss/45 hover:bg-moss/20 mt-auto block border py-2.5 text-center text-[10px] font-bold tracking-[0.1em] uppercase transition-colors"
        >
          Shiko Udhëtimin →
        </Link>
      </div>
    </div>
  );
}
