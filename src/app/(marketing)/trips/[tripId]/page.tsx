import {
  Award,
  Car,
  Droplets,
  Flashlight,
  Footprints,
  type LucideIcon,
  Package,
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
import { TripSocialActions } from "@/components/features/trips/trip-social-actions";
import { TripWeatherWidget } from "@/components/features/weather/trip-weather-widget";
import { getOptionalSession } from "@/lib/auth/helpers";
import { difficultyLabels, tripStatusLabels } from "@/lib/i18n/labels";
import { getClubStats } from "@/server/queries/clubs";
import { isTripFavorited } from "@/server/queries/favorites";
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
      <span className="bg-moss h-5 w-[3px]" />
      <h2 className="text-summit text-[12px] font-bold tracking-[0.1em] uppercase">
        {children}
      </h2>
    </div>
  );
}

function IconList({ items, icons }: { items: string[]; icons: LucideIcon[] }) {
  return (
    <div>
      {items.map((item, i) => {
        const Icon = icons[i % icons.length] ?? Package;
        return (
          <div
            key={item}
            className="border-summit/[0.06] flex items-center gap-2.5 border-b py-2.5 last:border-b-0"
          >
            <Icon className="text-summit/35 size-3.5 shrink-0" />
            <span className="text-summit/60 text-[12px] font-medium tracking-[0.04em] uppercase">
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
  const [registration, isSaved] = await Promise.all([
    session ? getUserRegistration(trip.id, session.user.id) : null,
    session ? isTripFavorited(session.user.id, trip.id) : false,
  ]);

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
  const location = [trip.club.city, "Kosovë"]
    .filter(Boolean)
    .join(", ")
    .toUpperCase();

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
    <div className="bg-abyss overflow-x-hidden">
      {/* Header */}
      <div className="border-summit/[0.08] border-b px-4 pt-5 pb-4 md:px-6">
        <p className="text-moss mb-2 text-[10px] font-semibold tracking-[0.1em] uppercase">
          {trip.club.name}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-summit text-[clamp(22px,3.5vw,36px)] leading-[1.2] font-extrabold tracking-[-0.02em] uppercase">
            {trip.title}
          </h1>
          <span className="border-moss/40 bg-moss/15 text-moss border px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase">
            {tripStatusLabels[trip.status]}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {meta.map((m, i) => (
            <span key={m} className="flex items-center gap-4">
              {i > 0 ? <span className="text-summit/20">·</span> : null}
              <span className="text-summit/45 text-[11px] font-medium tracking-[0.04em] uppercase">
                {m}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Two-column */}
      <div className="grid items-start gap-6 px-4 py-5 md:px-6 lg:grid-cols-[1fr_260px]">
        {/* Left */}
        <div className="min-w-0">
          {mapLat !== null && mapLng !== null ? (
            <div className="border-summit/10 relative mb-5 h-[280px] w-full overflow-hidden border">
              <TrailMap
                trailName={trip.title}
                startLat={mapLat}
                startLng={mapLng}
              />
              <div className="border-summit/15 bg-abyss absolute bottom-0 left-0 z-20 max-w-[calc(100%-1rem)] border-t border-r px-4 py-2.5">
                <p className="text-summit/35 mb-[3px] text-[8px] font-semibold tracking-[0.15em] uppercase">
                  Pika e takimit
                </p>
                <p className="font-heading text-summit truncate text-[14px] font-extrabold tracking-[-0.01em] uppercase">
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
                  <p
                    key={i}
                    className="text-summit/60 text-[13px] leading-[1.7] break-words"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          {/* Social actions */}
          <TripSocialActions
            title={`${trip.title} — ${trip.club.name} · HikeIt`}
            tripId={trip.id}
            isSaved={isSaved}
            isLoggedIn={!!session}
            returnPath={`/trips/${trip.slug}`}
          />
        </div>

        {/* Right sticky sidebar */}
        <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-[72px]">
          <TripRegistrationCard
            tripId={trip.id}
            slug={trip.slug}
            isLoggedIn={!!session}
            isPast={isPast}
            priceEur={trip.priceEur}
            confirmedCount={trip.confirmedCount}
            maxParticipants={trip.maxParticipants}
            commissionRate={trip.commissionRate}
            registration={
              registration
                ? {
                    id: registration.id,
                    status: registration.status,
                    paymentStatus: registration.paymentStatus,
                    isReregistration: registration.isReregistration,
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
        <div className="border-moss/15 bg-moss/[0.05] mx-4 mb-6 flex flex-wrap items-center justify-between gap-4 border px-5 py-4 md:mx-6">
          <div>
            <p className="text-summit/30 mb-1.5 text-[9px] font-semibold tracking-[0.12em] uppercase">
              Shtegu i aktivitetit
            </p>
            <p className="font-heading text-summit mb-2.5 text-base font-extrabold tracking-[-0.01em] uppercase">
              {trail.name}
            </p>
            <div className="flex gap-5">
              {trail.distanceKm ? (
                <TrailStat
                  label="Distanca"
                  value={`${Number(trail.distanceKm)}KM`}
                />
              ) : null}
              {trail.elevationGainM != null ? (
                <TrailStat
                  label="Lartësia"
                  value={`${trail.elevationGainM}M`}
                />
              ) : null}
              {trailDuration ? (
                <TrailStat label="Kohëzgjatja" value={trailDuration} />
              ) : null}
            </div>
          </div>
          <Link
            href={`/trails/${trail.slug}`}
            className="border-summit/40 text-summit/60 hover:border-moss hover:text-moss border px-4 py-2.5 text-[11px] font-bold tracking-[0.08em] uppercase transition-colors"
          >
            Shiko Shtegun →
          </Link>
        </div>
      ) : null}

      {/* Equipment + included */}
      {equipment.length > 0 || included.length > 0 ? (
        <div className="mx-4 mb-6 grid gap-10 sm:grid-cols-2 md:mx-6">
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
      <div className="mx-4 mb-6 md:mx-6">
        <TripWeatherWidget
          lat={mapLat}
          lng={mapLng}
          tripDate={trip.startDatetime}
          locationLabel={(trip.club.city ?? "Rajon").toUpperCase()}
        />
      </div>

      {/* Gallery */}
      <div className="px-4 pb-8 md:px-6">
        <div className="mb-3.5 flex items-center justify-between">
          <AccentHeader>Galeria</AccentHeader>
          {photos.length > 0 ? (
            <span className="text-summit/35 text-[11px] font-medium">
              {photos.length} FOTO
            </span>
          ) : null}
        </div>
        <TripGallery
          photos={photos.map((p) => ({
            id: p.id,
            publicId: p.cloudinaryPublicId,
          }))}
        />
      </div>
    </div>
  );
}

function TrailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-summit/30 mb-0.5 text-[8px] font-semibold tracking-[0.1em] uppercase">
        {label}
      </p>
      <p className="font-heading text-summit text-[18px] font-extrabold tracking-[-0.02em]">
        {value}
      </p>
    </div>
  );
}
