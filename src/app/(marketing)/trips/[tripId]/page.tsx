import { CalendarDays, ChevronRight, Download, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoGallery } from "@/components/features/images/photo-gallery";
import { TrailMap } from "@/components/features/trails/trail-map-loader";
import { RegisterCard } from "@/components/features/trips/register-card";
import { WeatherWidget } from "@/components/features/weather/weather-widget";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOptionalSession } from "@/lib/auth/helpers";
import { tripStatusLabels } from "@/lib/i18n/labels";
import { formatTripDateTime } from "@/lib/utils/datetime";
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

function spotsLabel(
  max: number | null,
  confirmed: number,
): { label: string; isFull: boolean } {
  if (max === null) return { label: "Vende të pakufizuara", isFull: false };
  const left = Math.max(0, max - confirmed);
  return {
    label: left === 0 ? "Plot" : `${left} / ${max} vende`,
    isFull: left === 0,
  };
}

export default async function PublicTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const trip = await getTripById(tripId);
  if (!trip) notFound();

  const [session, photos] = await Promise.all([
    getOptionalSession(),
    getTripPhotos(trip.id),
  ]);
  const registration = session
    ? await getUserRegistration(trip.id, session.user.id)
    : null;

  const isPast = trip.startDatetime < new Date();
  const { label, isFull } = spotsLabel(
    trip.maxParticipants,
    trip.confirmedCount,
  );

  const meetingLat = trip.meetingLat ? Number(trip.meetingLat) : null;
  const meetingLng = trip.meetingLng ? Number(trip.meetingLng) : null;
  const trail = trip.trail;
  const mapLat = meetingLat ?? (trail ? Number(trail.startLat) : null);
  const mapLng = meetingLng ?? (trail ? Number(trail.startLng) : null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/trips" className="hover:text-foreground">
          Udhëtimet
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">{trip.title}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{tripStatusLabels[trip.status]}</Badge>
              {trip.difficulty ? (
                <DifficultyBadge difficulty={trip.difficulty} />
              ) : null}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{trip.title}</h1>
            <Link
              href={`/clubs/${trip.club.slug}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {trip.club.name}
            </Link>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {formatTripDateTime(trip.startDatetime)}
              </span>
              {trip.meetingPoint ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {trip.meetingPoint}
                </span>
              ) : null}
            </div>
          </div>

          {mapLat !== null && mapLng !== null ? (
            <TrailMap
              trailName={trip.title}
              startLat={mapLat}
              startLng={mapLng}
            />
          ) : null}

          {trip.description ? (
            <section>
              <h2 className="text-xl font-bold">Përshkrimi</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
                {trip.description}
              </p>
            </section>
          ) : null}

          {trail ? (
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Shtegu</p>
                  <p className="font-medium">{trail.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[trail.region, trail.distanceKm && `${trail.distanceKm} km`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Link
                  href={`/trails/${trail.slug}`}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Shiko shtegun
                </Link>
              </CardContent>
            </Card>
          ) : null}

          {trip.requirements ? (
            <section>
              <h2 className="text-xl font-bold">Kërkesat</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {trip.requirements}
              </p>
            </section>
          ) : null}

          {trip.included ? (
            <section>
              <h2 className="text-xl font-bold">Çfarë përfshihet</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {trip.included}
              </p>
            </section>
          ) : null}

          <WeatherWidget lat={mapLat} lng={mapLng} />

          <section>
            <h2 className="mb-3 text-xl font-bold">
              Foto
              {photos.length > 0 ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {photos.length} foto
                </span>
              ) : null}
            </h2>
            {photos.length > 0 ? (
              <PhotoGallery
                photos={photos.map((p) => ({
                  id: p.id,
                  publicId: p.cloudinaryPublicId,
                  photographer: p.photographer,
                  caption: p.caption,
                }))}
              />
            ) : (
              <p className="rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
                Bëhu i pari që ndan kujtimet e këtij udhëtimi.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <RegisterCard
            tripId={trip.id}
            slug={trip.slug}
            isLoggedIn={!!session}
            isPast={isPast}
            isFull={isFull}
            priceEur={trip.priceEur}
            spotsLabel={label}
            registration={
              registration
                ? { id: registration.id, status: registration.status }
                : null
            }
          />
          {trip.gpxUrl ? (
            <Button
              variant="outline"
              className="w-full"
              render={<a href={trip.gpxUrl} download />}
            >
              <Download />
              Shkarko GPX
            </Button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
