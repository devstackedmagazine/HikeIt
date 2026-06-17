import { eq } from "drizzle-orm";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  CloudSun,
  Download,
  MapPin,
  Mountain,
  Route,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewsSection } from "@/components/features/trails/reviews-section";
import { ShareButtons } from "@/components/features/trails/share-buttons";
import { TrailCard } from "@/components/features/trails/trail-card";
import { TrailMap } from "@/components/features/trails/trail-map-loader";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import type { Trip } from "@/lib/db/schema";
import { trails } from "@/lib/db/schema";
import {
  featureLabels,
  seasonLabels,
  trailTypeLabels,
} from "@/lib/i18n/labels";
import { getTrailReviews } from "@/server/queries/reviews";
import {
  getTrailBySlug,
  getTrailsByRegion,
} from "@/server/queries/trails";
import { getUpcomingTripsByTrail } from "@/server/queries/trips";

const GEAR_BY_DIFFICULTY: Record<string, string[]> = {
  easy: ["Këpucë ecjeje", "Ujë (1L)", "Mbrojtëse dielli"],
  moderate: [
    "Këpucë ecjeje",
    "Ujë (1.5L)",
    "Shkopinj ecjeje",
    "Ushqim energjik",
    "Xhaketë kundër shiut",
  ],
  hard: [
    "Çizme malore",
    "Ujë (2L)",
    "Shkopinj ecjeje",
    "Veshje shtresore",
    "Hartë & GPS",
    "Ndihma e parë",
  ],
  expert: [
    "Çizme alpine",
    "Ujë (2L+)",
    "Veshje shtresore",
    "Hartë & GPS",
    "Pajisje alpine",
    "Strehë emergjence",
    "Ndihma e parë",
  ],
};

export async function generateStaticParams() {
  const rows = await db
    .select({ slug: trails.slug })
    .from(trails)
    .where(eq(trails.verified, true));
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trail = await getTrailBySlug(slug);
  if (!trail) return { title: "Shtegu nuk u gjet" };

  const description =
    trail.description ??
    `Shteg ${trail.difficulty} në ${trail.region ?? "Kosovë"}.`;
  return {
    title: trail.name,
    description,
    alternates: { canonical: `https://hikeit.app/trails/${trail.slug}` },
    openGraph: { title: trail.name, description, type: "article" },
  };
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} orë`;
}

function formatTripDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function TripMiniCard({ trip }: { trip: Trip }) {
  const free = Number(trip.priceEur) === 0;
  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="block rounded-lg border p-3 transition-colors hover:bg-muted"
    >
      <p className="line-clamp-1 text-sm font-medium">{trip.title}</p>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" />
          {formatTripDate(trip.startDatetime)}
        </span>
        <span className="font-medium text-foreground">
          {free ? "Falas" : `€${trip.priceEur}`}
        </span>
      </div>
    </Link>
  );
}

export default async function TrailDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trail = await getTrailBySlug(slug);
  if (!trail) notFound();

  const [session, reviewData, upcomingTrips, regionTrails] = await Promise.all([
    getOptionalSession(),
    getTrailReviews(trail.id),
    getUpcomingTripsByTrail(trail.id),
    trail.region ? getTrailsByRegion(trail.region) : Promise.resolve([]),
  ]);

  const nearbyTrails = regionTrails
    .filter((t) => t.id !== trail.id)
    .slice(0, 3);

  const duration = formatDuration(trail.estimatedDurationMin);
  const seasons = trail.seasons ?? [];
  const features = trail.features ?? [];
  const gear = GEAR_BY_DIFFICULTY[trail.difficulty] ?? [];

  const stats = [
    trail.distanceKm
      ? { icon: MapPin, label: "Distanca", value: `${trail.distanceKm} km` }
      : null,
    trail.elevationGainM
      ? {
          icon: TrendingUp,
          label: "Ngjitje",
          value: `${trail.elevationGainM} m`,
        }
      : null,
    duration ? { icon: Clock, label: "Kohëzgjatja", value: duration } : null,
    trail.trailType
      ? {
          icon: Route,
          label: "Lloji",
          value: trailTypeLabels[trail.trailType] ?? trail.trailType,
        }
      : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Ballina
        </Link>
        <ChevronRight className="size-4" />
        <Link href="/trails" className="hover:text-foreground">
          Shtigjet
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">{trail.name}</span>
      </nav>

      {/* Hero */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={trail.difficulty} />
          {trail.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              ✓ Verifikuar
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {trail.name}
        </h1>
        {(trail.region || trail.city) && (
          <p className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-4" />
            {[trail.region, trail.city, "Kosovë"].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border p-4">
              <stat.icon className="size-5 text-primary" />
              <p className="mt-2 text-lg font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="mt-8">
        <TrailMap
          trailName={trail.name}
          startLat={Number(trail.startLat)}
          startLng={Number(trail.startLng)}
          endLat={trail.endLat ? Number(trail.endLat) : null}
          endLng={trail.endLng ? Number(trail.endLng) : null}
        />
      </div>

      {/* Info grid */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {trail.description ? (
            <section>
              <h2 className="text-xl font-bold">Përshkrimi</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {trail.description}
              </p>
            </section>
          ) : null}

          {seasons.length > 0 ? (
            <section>
              <h2 className="text-xl font-bold">Stinët më të mira</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {seasons.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    {seasonLabels[s] ?? s}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {features.length > 0 ? (
            <section>
              <h2 className="text-xl font-bold">Karakteristikat</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {features.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                  >
                    <Mountain className="size-3.5" />
                    {featureLabels[f] ?? f}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {gear.length > 0 ? (
            <section>
              <h2 className="text-xl font-bold">Pajisjet e rekomanduara</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {gear.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Sticky sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Udhëtime të ardhshme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingTrips.length > 0 ? (
                <>
                  {upcomingTrips.map((trip) => (
                    <TripMiniCard key={trip.id} trip={trip} />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    render={<Link href="/trips" />}
                  >
                    Shiko të gjitha
                    <ArrowRight />
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Asnjë udhëtim aktiv për këtë shteg.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
              <CloudSun className="size-5 text-accent" />
              Moti — së shpejti
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full"
            disabled={!trail.gpxUrl}
            {...(trail.gpxUrl
              ? { render: <a href={trail.gpxUrl} download /> }
              : {})}
          >
            <Download />
            {trail.gpxUrl ? "Shkarko GPX" : "GPX — Së shpejti"}
          </Button>

          <ShareButtons title={trail.name} />
        </aside>
      </div>

      {/* Reviews */}
      <div className="mt-14">
        <ReviewsSection
          trailId={trail.id}
          reviews={reviewData.reviews}
          average={reviewData.average}
          count={reviewData.count}
          isLoggedIn={!!session}
        />
      </div>

      {/* Nearby trails */}
      {nearbyTrails.length > 0 ? (
        <div className="mt-14">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              Shtigje afër
            </h2>
            {trail.region ? (
              <Link
                href={`/trails?region=${encodeURIComponent(trail.region)}`}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Të gjitha në {trail.region}
              </Link>
            ) : null}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyTrails.map((t) => (
              <TrailCard key={t.id} trail={t} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
