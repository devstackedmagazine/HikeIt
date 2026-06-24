import { eq } from "drizzle-orm";
import { AlertTriangle, Bookmark, Download, Share2, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CloudImage } from "@/components/features/images/cloud-image";
import { ElevationChart } from "@/components/features/trails/elevation-chart";
import { ReviewForm } from "@/components/features/trails/review-form";
import { TrailMap } from "@/components/features/trails/trail-map-loader";
import { WeatherWidget } from "@/components/features/weather/weather-widget";
import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import type { Trail } from "@/lib/db/schema";
import { trails } from "@/lib/db/schema";
import { featureLabels, seasonLabels, trailTypeLabels } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils/cn";
import { getTrailReviews, type TrailReview } from "@/server/queries/reviews";
import { getTrailBySlug, getTrailsByRegion } from "@/server/queries/trails";
import { getUpcomingTripsByTrail } from "@/server/queries/trips";

const DIFFICULTY_BADGE: Record<
  Trail["difficulty"],
  { letter: string; className: string }
> = {
  easy: { letter: "L", className: "bg-moss text-abyss" },
  moderate: { letter: "M", className: "bg-alert text-abyss" },
  hard: { letter: "V", className: "bg-sunset text-summit" },
  expert: { letter: "E", className: "bg-danger text-summit" },
};

/** Mandatory gear by difficulty — only shown for hard/expert trails. */
const SAFETY_REQUIREMENTS: Partial<Record<Trail["difficulty"], string[]>> = {
  expert: [
    "Këpucë profesionale (Hiking Boots)",
    "Paisje për orientim (GPS/Hartë)",
    "Minimum 3L ujë per person",
    "Veshje shtesë për erë të fortë",
  ],
  hard: ["Këpucë profesionale (Hiking Boots)", "Minimum 2L ujë per person"],
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

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatReviewDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

function Stars({ value, size }: { value: number; size: string }) {
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size,
            i <= rounded ? "fill-moss text-moss" : "text-summit/20",
          )}
        />
      ))}
    </div>
  );
}

function SectionLabel({
  children,
  accent,
}: {
  children: string;
  accent?: boolean;
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-bold tracking-[0.15em] text-summit/35 uppercase",
        accent && "border-l-[3px] border-moss pl-2.5",
      )}
    >
      {children}
    </p>
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

  const isLoggedIn = !!session;
  const nearbyTrails = regionTrails.filter((t) => t.id !== trail.id).slice(0, 3);
  const badge = DIFFICULTY_BADGE[trail.difficulty];
  const region = (trail.region ?? "").toUpperCase();
  const locationLine = [trail.region, trail.city]
    .filter(Boolean)
    .join(" - ")
    .toUpperCase();

  const distanceKm = trail.distanceKm ? Number(trail.distanceKm) : null;
  const durationH =
    trail.estimatedDurationMin != null ? trail.estimatedDurationMin / 60 : null;

  const stats = [
    distanceKm != null
      ? { label: "Distancë", value: `${distanceKm.toFixed(1)} KM` }
      : null,
    trail.elevationGainM != null
      ? { label: "Ngjit. Max", value: `${trail.elevationGainM} M` }
      : null,
    durationH != null
      ? {
          label: "Kohëzgjatja",
          value: `${Number.isInteger(durationH) ? durationH : durationH.toFixed(1)} ORË`,
        }
      : null,
    trail.trailType
      ? {
          label: "Llojet",
          value: (
            trailTypeLabels[trail.trailType] ?? trail.trailType
          ).toUpperCase(),
        }
      : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  const seasons = trail.seasons ?? [];
  const features = trail.features ?? [];
  const safety = SAFETY_REQUIREMENTS[trail.difficulty] ?? [];
  const paragraphs = (trail.description ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="bg-abyss">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 px-6 py-3 text-[11px] font-medium tracking-[0.06em] uppercase">
        <Link href="/trails" className="text-summit/40 hover:text-summit/70">
          Shtigjet
        </Link>
        {region ? (
          <>
            <span className="text-summit/20">/</span>
            <Link
              href={`/trails?region=${encodeURIComponent(trail.region ?? "")}`}
              className="text-summit/40 hover:text-summit/70"
            >
              {region}
            </Link>
          </>
        ) : null}
        <span className="text-summit/20">/</span>
        <span className="text-summit/70">{trail.name.toUpperCase()}</span>
      </nav>

      {/* Hero */}
      <div className="relative min-h-[140px] overflow-hidden px-6 pt-5 pb-6">
        {trail.coverImageUrl ? (
          <CloudImage
            publicId={trail.coverImageUrl}
            size="cover"
            alt={trail.name}
            fallback="trail"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-forest to-abyss" />
        )}
        <div className="absolute inset-0 bg-[rgba(13,31,20,0.82)]" />

        <div className="relative">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "px-2.5 py-1 text-[11px] font-extrabold uppercase",
                badge.className,
              )}
            >
              {badge.letter}
            </span>
            {trail.verified ? (
              <span className="border border-moss bg-[rgba(13,31,20,0.85)] px-2.5 py-1 text-[9px] font-bold tracking-[0.08em] text-moss uppercase">
                ✓ Verifikuar
              </span>
            ) : null}
          </div>

          <h1 className="font-heading mb-1.5 text-[clamp(24px,4vw,40px)] leading-none font-extrabold tracking-[-0.02em] text-summit uppercase">
            {trail.name}
          </h1>

          {locationLine ? (
            <p className="mb-4 text-[11px] font-semibold tracking-[0.08em] text-moss uppercase">
              {locationLine}
            </p>
          ) : null}

          {stats.length > 0 ? (
            <div className="flex flex-wrap">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={cn(
                    "border-y border-r border-summit/10 bg-summit/[0.06] px-4 py-2",
                    i === 0 && "border-l",
                  )}
                >
                  <p className="mb-[3px] text-[8px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
                    {stat.label}
                  </p>
                  <p className="font-heading text-[13px] font-bold tracking-[-0.01em] text-summit uppercase">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Two-column main */}
      <div className="grid gap-5 px-6 py-5 lg:grid-cols-[1fr_320px]">
        {/* Left */}
        <div>
          {/* Map */}
          <div className="relative mb-4 h-[260px] overflow-hidden border border-summit/10 bg-[#0F2818]">
            <TrailMap
              trailName={trail.name}
              startLat={Number(trail.startLat)}
              startLng={Number(trail.startLng)}
              endLat={trail.endLat ? Number(trail.endLat) : null}
              endLng={trail.endLng ? Number(trail.endLng) : null}
            />
            {trail.elevationGainM != null ? (
              <span className="pointer-events-none absolute top-2.5 right-2.5 z-[400] bg-[rgba(13,31,20,0.7)] px-2 py-[3px] text-[9px] font-semibold tracking-[0.08em] text-summit/60 uppercase">
                {trail.elevationGainM}m Lartësia Max
              </span>
            ) : null}
          </div>

          {/* Elevation profile */}
          {trail.elevationProfile && trail.elevationProfile.length > 1 ? (
            <div className="border border-summit/10 p-4">
              <p className="mb-3 text-[10px] font-bold tracking-[0.12em] text-summit/40 uppercase">
                Profili i Lartësisë
              </p>
              <ElevationChart data={trail.elevationProfile} />
            </div>
          ) : null}
        </div>

        {/* Right sidebar */}
        <aside>
          <div className="mb-3">
            <WeatherWidget
              lat={trail.startLat ? Number(trail.startLat) : null}
              lng={trail.startLng ? Number(trail.startLng) : null}
            />
          </div>

          {/* Upcoming trips */}
          <div className="mb-3">
            <p className="mb-3 text-[10px] font-bold tracking-[0.12em] text-summit/40 uppercase">
              Udhëtime të Ardhshme
            </p>
            {upcomingTrips.length > 0 ? (
              <div>
                {upcomingTrips.slice(0, 2).map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.slug}`}
                    className="block border-b border-summit/[0.06] pb-2.5 last:border-b-0 [&+a]:pt-2.5"
                  >
                    <p className="mb-[3px] text-[9px] font-bold tracking-[0.1em] text-moss uppercase">
                      {new Intl.DateTimeFormat("sq-AL", {
                        day: "numeric",
                        month: "long",
                      })
                        .format(trip.startDatetime)
                        .toUpperCase()}
                    </p>
                    <p className="font-heading text-[13px] font-bold tracking-[-0.01em] text-summit uppercase">
                      {trip.title}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-summit/35">
                Nuk ka udhëtime të ardhshme.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {trail.gpxUrl ? (
              <a
                href={trail.gpxUrl}
                download
                className="flex flex-1 items-center justify-center gap-1.5 border border-moss/30 bg-moss/[0.12] px-4 py-2.5 text-[11px] font-bold tracking-[0.08em] text-moss uppercase transition-colors hover:bg-moss/20"
              >
                <Download className="size-3.5" />
                Shkarko GPX
              </a>
            ) : (
              <span className="flex flex-1 items-center justify-center gap-1.5 border border-moss/30 bg-moss/[0.12] px-4 py-2.5 text-[11px] font-bold tracking-[0.08em] text-moss uppercase opacity-40">
                <Download className="size-3.5" />
                GPX — Së shpejti
              </span>
            )}
            <button
              type="button"
              aria-label="Ruaj shtegun"
              className="flex size-[38px] items-center justify-center border border-summit/15 bg-summit/[0.05] text-summit/50 transition-colors hover:text-summit"
            >
              <Bookmark className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Ndaj shtegun"
              className="flex size-[38px] items-center justify-center border border-summit/15 bg-summit/[0.05] text-summit/50 transition-colors hover:text-summit"
            >
              <Share2 className="size-4" />
            </button>
          </div>
        </aside>
      </div>

      {/* Description */}
      {paragraphs.length > 0 ? (
        <section className="mb-6 px-6">
          <SectionLabel accent>Përshkrimi</SectionLabel>
          <div className="mt-3.5 space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-[13px] leading-[1.7] text-summit/65">
                {p}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {/* Seasons + characteristics */}
      {seasons.length > 0 || features.length > 0 ? (
        <section className="mb-5 flex flex-wrap gap-8 px-6">
          {seasons.length > 0 ? (
            <div>
              <p className="mb-2.5 text-[10px] font-bold tracking-[0.12em] text-summit/35 uppercase">
                Sezonat më të mira
              </p>
              <div className="flex flex-wrap gap-1.5">
                {seasons.map((s) => (
                  <span
                    key={s}
                    className="border border-moss/40 bg-moss/15 px-3 py-[5px] text-[10px] font-bold tracking-[0.06em] text-moss uppercase"
                  >
                    {seasonLabels[s] ?? s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {features.length > 0 ? (
            <div>
              <p className="mb-2.5 text-[10px] font-bold tracking-[0.12em] text-summit/35 uppercase">
                Karakteristikat
              </p>
              <div className="flex flex-wrap gap-1.5">
                {features.map((f) => (
                  <span
                    key={f}
                    className="border border-summit/12 bg-summit/[0.06] px-3 py-[5px] text-[10px] font-semibold tracking-[0.06em] text-summit/55 uppercase"
                  >
                    {featureLabels[f] ?? f}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Safety */}
      {safety.length > 0 ? (
        <section className="mx-6 mb-6 border border-danger/25 bg-danger/[0.08] px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-danger" />
            <span className="text-[11px] font-bold tracking-[0.08em] text-danger uppercase">
              Kërkesa e Sigurisë
            </span>
          </div>
          <div className="grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
            {safety.map((item) => (
              <div key={item} className="flex items-start gap-1.5">
                <span className="mt-1.5 size-[3px] shrink-0 bg-danger/60" />
                <span className="text-[11px] leading-[1.4] font-medium text-summit/60 uppercase">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Reviews */}
      <section className="mb-8 px-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <SectionLabel>Vlerësimet</SectionLabel>
            {reviewData.count > 0 ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="font-heading text-xl font-extrabold text-summit">
                  {reviewData.average.toFixed(1)}
                </span>
                <Stars value={reviewData.average} size="size-3.5" />
              </div>
            ) : null}
          </div>
          {!isLoggedIn ? (
            <Link
              href="/login?redirect=/trails"
              className="border border-summit/20 px-3.5 py-2 text-[10px] font-bold tracking-[0.08em] text-summit/60 uppercase transition-colors hover:text-summit"
            >
              Shto Vlerësim
            </Link>
          ) : null}
        </div>

        {reviewData.count === 0 ? (
          <p className="text-xs text-summit/40">
            Bëhu i pari që vlerëson këtë shteg.
          </p>
        ) : (
          <div>
            {reviewData.reviews.map((review: TrailReview) => (
              <div key={review.id} className="border-b border-summit/[0.06] py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest text-[13px] font-bold text-moss">
                      {initials(review.userName)}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-summit">
                        {review.userName ?? "Anëtar"}
                      </p>
                      <p className="text-[10px] text-summit/30">
                        {formatReviewDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Stars value={review.rating} size="size-3" />
                </div>
                {review.comment ? (
                  <p className="mt-2.5 text-[12px] leading-[1.65] text-summit/60">
                    {review.comment}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {isLoggedIn ? (
          <div className="mt-6">
            <ReviewForm trailId={trail.id} />
          </div>
        ) : null}
      </section>

      {/* Nearby trails */}
      {nearbyTrails.length > 0 ? (
        <section className="border-t border-summit/[0.08] px-6 pt-8 pb-12">
          <p className="mb-4 text-[10px] font-bold tracking-[0.15em] text-summit/35 uppercase">
            Shtigjet tjera në rajon
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyTrails.map((t) => {
              const nb = DIFFICULTY_BADGE[t.difficulty];
              const dist = t.distanceKm ? Number(t.distanceKm).toFixed(1) : null;
              return (
                <Link
                  key={t.id}
                  href={`/trails/${t.slug}`}
                  className="overflow-hidden border border-summit/[0.08]"
                >
                  <div className="relative h-[140px] overflow-hidden">
                    <CloudImage
                      publicId={t.coverImageUrl}
                      size="thumbnail"
                      alt={t.name}
                      fallback="trail"
                      className="h-full w-full"
                    />
                    <span
                      className={cn(
                        "absolute top-2 left-2 px-2 py-0.5 text-[10px] font-extrabold uppercase",
                        nb.className,
                      )}
                    >
                      {nb.letter}
                    </span>
                    {t.verified ? (
                      <span className="absolute top-2 right-2 border border-moss bg-[rgba(13,31,20,0.85)] px-1.5 py-0.5 text-[8px] font-bold tracking-[0.08em] text-moss uppercase">
                        ✓
                      </span>
                    ) : null}
                  </div>
                  <div className="bg-summit/[0.02] p-3">
                    <h3 className="font-heading text-[13px] font-extrabold text-summit uppercase">
                      {t.name}
                    </h3>
                    <p className="mt-1 text-[10px] font-medium text-summit/45">
                      {dist ? `${dist} KM` : "—"}
                      {t.elevationGainM != null
                        ? ` · ${t.elevationGainM}M NGJITJE`
                        : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
