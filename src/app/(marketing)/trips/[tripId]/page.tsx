import {
  Award,
  Car,
  Droplets,
  Flag,
  Flashlight,
  Footprints,
  Heart,
  type LucideIcon,
  Package,
  Share2,
  Shield,
  Shirt,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TripGallery } from "@/components/features/images/trip-gallery";
import { TrailMap } from "@/components/features/trails/trail-map-loader";
import { TripOrganizerCard } from "@/components/features/trips/trip-organizer-card";
import { TripRegistrationCard } from "@/components/features/trips/trip-registration-card";
import { TripWeatherWidget } from "@/components/features/weather/trip-weather-widget";
import { getOptionalSession } from "@/lib/auth/helpers";
import { difficultyLabels, tripStatusLabels } from "@/lib/i18n/labels";
import { getClubStats } from "@/server/queries/clubs";
import { getTripPhotos } from "@/server/queries/photos";
import { getTripById, getUserRegistration } from "@/server/queries/trips";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tripId: string }>;
}): Promise<Metadata> {
  const { tripId } = await params;
  const trip = await getTripById(tripId);
  if (!trip) return { title: "Udhëtimi nuk u gjet" };
  return {
    title: trip.title,
    description: trip.description ?? `Udhëtim me ${trip.club.name}.`,
  };
}

const EQUIPMENT_ICONS: LucideIcon[] = [Footprints, Droplets, Shirt, Flashlight];
const INCLUDED_ICONS: LucideIcon[] = [Award, Car, Shield];

function splitLines(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n|;/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function AccentHeader({ children }: { children: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className="h-5 w-[3px] bg-moss" />
      <h2 className="text-[12px] font-bold tracking-[0.1em] text-summit uppercase">
        {children}
      </h2>
    </div>
  );
}

function IconList({
  items,
  icons,
}: {
  items: string[];
  icons: LucideIcon[];
}) {
  return (
    <div>
      {items.map((item, i) => {
        const Icon = icons[i % icons.length] ?? Package;
        return (
          <div
            key={item}
            className="flex items-center gap-2.5 border-b border-summit/[0.06] py-2.5 last:border-b-0"
          >
            <Icon className="size-3.5 shrink-0 text-summit/35" />
            <span className="text-[12px] font-medium tracking-[0.04em] text-summit/60 uppercase">
              {item}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default async function PublicTripPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { tripId } = await params;
  const { payment } = await searchParams;
  const trip = await getTripById(tripId);
  if (!trip) notFound();

  const [session, photos, clubStats] = await Promise.all([
    getOptionalSession(),
    getTripPhotos(trip.id),
    getClubStats(trip.club.id),
  ]);
  const registration = session
    ? await getUserRegistration(trip.id, session.user.id)
    : null;

  const isPast = trip.startDatetime < new Date();
  const trail = trip.trail;
  const meetingLat = trip.meetingLat ? Number(trip.meetingLat) : null;
  const meetingLng = trip.meetingLng ? Number(trip.meetingLng) : null;
  const mapLat = meetingLat ?? (trail ? Number(trail.startLat) : null);
  const mapLng = meetingLng ?? (trail ? Number(trail.startLng) : null);

  const dateLabel = new Intl.DateTimeFormat("sq-AL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(trip.startDatetime)
    .toUpperCase();
  const timeLabel = new Intl.DateTimeFormat("sq-AL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(trip.startDatetime);
  const location = [trip.club.city, "Kosovë"].filter(Boolean).join(", ").toUpperCase();

  const meta = [
    dateLabel,
    timeLabel,
    location,
    trip.difficulty
      ? `VËSHTIRËSIA: ${(difficultyLabels[trip.difficulty] ?? trip.difficulty).toUpperCase()}`
      : null,
  ].filter(Boolean) as string[];

  const paragraphs = splitLines(trip.description);
  const equipment = splitLines(trip.requirements);
  const included = splitLines(trip.included);
  const tripCount = clubStats.activeTrips + clubStats.completedTrips;

  const trailDuration =
    trail?.estimatedDurationMin != null
      ? `~${Math.round(trail.estimatedDurationMin / 60)}H`
      : null;

  return (
    <div className="bg-abyss">
      {/* Header */}
      <div className="border-b border-summit/[0.08] px-6 pt-5 pb-4">
        <p className="mb-2 text-[10px] font-semibold tracking-[0.1em] text-moss uppercase">
          {trip.club.name}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-[clamp(22px,3.5vw,36px)] leading-none font-extrabold tracking-[-0.02em] text-summit uppercase">
            {trip.title}
          </h1>
          <span className="border border-moss/40 bg-moss/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] text-moss uppercase">
            {tripStatusLabels[trip.status]}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {meta.map((m, i) => (
            <span key={m} className="flex items-center gap-4">
              {i > 0 ? <span className="text-summit/20">·</span> : null}
              <span className="text-[11px] font-medium tracking-[0.04em] text-summit/45 uppercase">
                {m}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Two-column */}
      <div className="grid items-start gap-6 px-6 py-5 lg:grid-cols-[1fr_260px]">
        {/* Left */}
        <div>
          {mapLat !== null && mapLng !== null ? (
            <div className="relative mb-5 h-[280px] overflow-hidden border border-summit/10">
              <TrailMap trailName={trip.title} startLat={mapLat} startLng={mapLng} />
              <div className="absolute bottom-0 left-0 z-[400] border-t border-r border-summit/15 bg-abyss px-4 py-2.5">
                <p className="mb-[3px] text-[8px] font-semibold tracking-[0.15em] text-summit/35 uppercase">
                  Pika e takimit
                </p>
                <p className="font-heading text-[14px] font-extrabold tracking-[-0.01em] text-summit uppercase">
                  {trip.meetingPoint ?? location}
                </p>
              </div>
            </div>
          ) : null}

          {paragraphs.length > 0 ? (
            <section className="mb-6">
              <AccentHeader>Përshkrimi</AccentHeader>
              <div className="space-y-3">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-[13px] leading-[1.7] text-summit/60">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          {/* Social actions */}
          <div className="flex items-center gap-3 border-t border-summit/[0.06] pt-4">
            {[Share2, Heart, Flag].map((Icon, i) => (
              <span
                key={i}
                className="flex size-8 items-center justify-center border border-summit/15 text-summit/40"
              >
                <Icon className="size-3.5" />
              </span>
            ))}
          </div>
        </div>

        {/* Right sticky sidebar */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-[72px]">
          <TripRegistrationCard
            tripId={trip.id}
            slug={trip.slug}
            isLoggedIn={!!session}
            isPast={isPast}
            priceEur={trip.priceEur}
            confirmedCount={trip.confirmedCount}
            maxParticipants={trip.maxParticipants}
            registration={
              registration
                ? {
                    id: registration.id,
                    status: registration.status,
                    paymentStatus: registration.paymentStatus,
                  }
                : null
            }
            returnedFromCheckout={payment === "success"}
          />
          <TripOrganizerCard
            clubName={trip.club.name}
            clubSlug={trip.club.slug}
            memberCount={clubStats.memberCount}
            tripCount={tripCount}
          />
        </aside>
      </div>

      {/* Trail info card */}
      {trail ? (
        <div className="mx-6 mb-6 flex flex-wrap items-center justify-between gap-4 border border-moss/15 bg-moss/[0.05] px-5 py-4">
          <div>
            <p className="mb-1.5 text-[9px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
              Shtegu i aktivitetit
            </p>
            <p className="font-heading mb-2.5 text-base font-extrabold tracking-[-0.01em] text-summit uppercase">
              {trail.name}
            </p>
            <div className="flex gap-5">
              {trail.distanceKm ? (
                <TrailStat label="Distanca" value={`${Number(trail.distanceKm)}KM`} />
              ) : null}
              {trail.elevationGainM != null ? (
                <TrailStat label="Lartësia" value={`${trail.elevationGainM}M`} />
              ) : null}
              {trailDuration ? (
                <TrailStat label="Kohëzgjatja" value={trailDuration} />
              ) : null}
            </div>
          </div>
          <Link
            href={`/trails/${trail.slug}`}
            className="border border-summit/25 px-4 py-2.5 text-[11px] font-bold tracking-[0.08em] text-summit/60 uppercase transition-colors hover:border-moss hover:text-moss"
          >
            Shiko Shtegun →
          </Link>
        </div>
      ) : null}

      {/* Equipment + included */}
      {equipment.length > 0 || included.length > 0 ? (
        <div className="mx-6 mb-6 grid gap-10 sm:grid-cols-2">
          {equipment.length > 0 ? (
            <div>
              <AccentHeader>Pajisjet e nevojshme</AccentHeader>
              <IconList items={equipment} icons={EQUIPMENT_ICONS} />
            </div>
          ) : null}
          {included.length > 0 ? (
            <div>
              <AccentHeader>Çka përfshihet</AccentHeader>
              <IconList items={included} icons={INCLUDED_ICONS} />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Weather */}
      <div className="mx-6 mb-6">
        <TripWeatherWidget
          lat={mapLat}
          lng={mapLng}
          tripDate={trip.startDatetime}
          locationLabel={(trip.club.city ?? "Rajon").toUpperCase()}
        />
      </div>

      {/* Gallery */}
      <div className="px-6 pb-8">
        <div className="mb-3.5 flex items-center justify-between">
          <AccentHeader>Galeria</AccentHeader>
          {photos.length > 0 ? (
            <span className="text-[11px] font-medium text-summit/35">
              {photos.length} FOTO
            </span>
          ) : null}
        </div>
        <TripGallery
          photos={photos.map((p) => ({ id: p.id, publicId: p.cloudinaryPublicId }))}
        />
      </div>
    </div>
  );
}

function TrailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[8px] font-semibold tracking-[0.1em] text-summit/30 uppercase">
        {label}
      </p>
      <p className="font-heading text-[18px] font-extrabold tracking-[-0.02em] text-summit">
        {value}
      </p>
    </div>
  );
}
