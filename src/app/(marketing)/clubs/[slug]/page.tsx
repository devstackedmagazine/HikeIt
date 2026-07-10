import {
  AtSign,
  CalendarDays,
  ExternalLink,
  Globe,
  MapPin,
  Mountain,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JoinClubButton } from "@/components/features/clubs/join-club-button";
import { CloudImage } from "@/components/features/images/cloud-image";
import { PhotoGallery } from "@/components/features/images/photo-gallery";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOptionalSession } from "@/lib/auth/helpers";
import type { Trip } from "@/lib/db/schema";
import { getClubBySlug } from "@/server/queries/clubs";
import { getClubPhotos } from "@/server/queries/photos";
import { getUpcomingTripsByClub } from "@/server/queries/trips";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) return { title: "Klubi nuk u gjet" };

  const description =
    club.description ?? `Klub alpinizmi në ${club.city ?? "Kosovë"}.`;
  return {
    title: club.name,
    description,
    alternates: { canonical: `https://hikeit.app/clubs/${club.slug}` },
  };
}

function formatTripDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function TripCard({ trip }: { trip: Trip }) {
  const free = Number(trip.priceEur) === 0;
  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="block rounded-xl border p-4 transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-tight">{trip.title}</p>
        {trip.difficulty ? (
          <DifficultyBadge difficulty={trip.difficulty} />
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-4" />
          {formatTripDate(trip.startDatetime)}
        </span>
        <span className="font-medium text-foreground">
          {free ? "Falas" : `€${trip.priceEur}`}
        </span>
      </div>
    </Link>
  );
}

export default async function ClubProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) notFound();

  const [session, upcomingTrips, clubPhotos] = await Promise.all([
    getOptionalSession(),
    getUpcomingTripsByClub(club.id),
    getClubPhotos(club.id),
  ]);

  const yearsActive = club.foundedYear
    ? new Date().getFullYear() - club.foundedYear
    : null;

  const stats = [
    { label: "Anëtarë", value: club.memberCount },
    { label: "Udhëtime të kryera", value: club.completedTripsCount },
    { label: "Vite aktive", value: yearsActive ?? "—" },
    { label: "Udhëtime aktive", value: club.upcomingTripsCount },
  ];

  const socials = [
    club.website ? { icon: Globe, href: club.website, label: "Website" } : null,
    club.instagram
      ? {
          icon: AtSign,
          href: `https://instagram.com/${club.instagram.replace("@", "")}`,
          label: "Instagram",
        }
      : null,
    club.facebook
      ? { icon: ExternalLink, href: club.facebook, label: "Facebook" }
      : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <div>
      {/* Cover + logo */}
      <div className="relative h-48 sm:h-56">
        <CloudImage
          publicId={club.coverUrl}
          size="cover"
          alt={`${club.name} cover`}
          fallback="club"
          className="h-full w-full"
          priority
        />
        <div className="mx-auto h-full max-w-5xl px-4 sm:px-6">
          <div className="absolute -bottom-10 size-24 overflow-hidden rounded-2xl border-4 border-background bg-muted">
            <CloudImage
              publicId={club.logoUrl}
              size="avatar"
              alt={`${club.name} logo`}
              fallback="club"
              className="h-full w-full"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mt-14 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{club.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-4" />
              {club.city ?? "Kosovë"}
            </p>
            {socials.length > 0 ? (
              <div className="mt-3 flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <s.icon className="size-5" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <JoinClubButton
            organizationId={club.id}
            slug={club.slug}
            isLoggedIn={!!session}
          />
        </div>

        {/* Stats bar */}
        <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border bg-moss/30 p-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* About */}
        {club.description ? (
          <section className="mt-10">
            <h2 className="text-xl font-bold">Rreth klubit</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {club.description}
            </p>
            {club.foundedYear ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Themeluar në {club.foundedYear}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Upcoming trips */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Udhëtime të ardhshme</h2>
            <Link
              href={`/trips?club=${club.slug}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Shiko të gjitha
            </Link>
          </div>
          {upcomingTrips.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcomingTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Mountain}
              title="Ky klub nuk ka udhëtime aktive"
              description="Kontrollo më vonë për aventura të reja."
            />
          )}
        </section>

        {clubPhotos.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold">Galeria</h2>
            <PhotoGallery
              photos={clubPhotos.map((p) => ({
                id: p.id,
                publicId: p.cloudinaryPublicId,
                photographer: p.photographer,
                caption: p.caption,
              }))}
            />
          </section>
        ) : null}

        {/* Members + join */}
        <section className="mt-10 mb-16 grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anëtarët</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {club.memberCount}
              </p>
              <p className="text-sm text-muted-foreground">anëtarë aktivë</p>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-center">
            <CardContent className="space-y-3 py-6">
              <p className="font-semibold">Bashkohu me {club.name}</p>
              <p className="text-sm text-muted-foreground">
                Bëhu pjesë e komunitetit dhe merr pjesë në udhëtime.
              </p>
              <JoinClubButton
                organizationId={club.id}
                slug={club.slug}
                isLoggedIn={!!session}
                className="w-full"
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
