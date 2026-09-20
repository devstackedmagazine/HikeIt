import { eq } from "drizzle-orm";
import { AlertTriangle, Download, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CloudImage } from "@/components/features/images/cloud-image";
import { ElevationChart } from "@/components/features/trails/elevation-chart";
import { ReviewForm } from "@/components/features/trails/review-form";
import { TrailFavoriteButton } from "@/components/features/trails/trail-favorite-button";
import { TrailGpxSection } from "@/components/features/trails/trail-gpx-section";
import { TrailMap } from "@/components/features/trails/trail-map-loader";
import { WeatherWidget } from "@/components/features/weather/weather-widget";
import { ShareButton } from "@/components/shared/share-button";
import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import type { Trail } from "@/lib/db/schema";
import { trails, users } from "@/lib/db/schema";
import {
  featureLabels,
  seasonLabels,
  trailTypeLabels,
} from "@/lib/i18n/labels";
import { cn } from "@/lib/utils/cn";
import { isTrailFavorited } from "@/server/queries/favorites";
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

/**
 * Whether `userId` may see a trail that isn't verified yet — its submitter,
 * previewing their own pending submission, or a super admin reviewing it.
 * The same two roles `uploadTrailGpx` already trusts, so this is also what
 * gates the GPX-upload section below, not a separate rule.
 */
async function isTrailManager(
  userId: string | undefined,
  trail: Pick<Trail, "submittedBy">,
): Promise<boolean> {
  if (!userId) return false;
  if (trail.submittedBy === userId) return true;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true },
  });
  return user?.role === "super_admin";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trail = await getTrailBySlug(slug);
  if (!trail) return { title: "Shtegu nuk u gjet" };

  // Metadata is generated independently of the page body below, so an
  // unverified trail's name/description/cover image would otherwise still
  // leak into <title>, OG tags and search snippets even once the page itself
  // 404s for an unauthorized visitor.
  if (!trail.verified) {
    const session = await getOptionalSession();
    if (!(await isTrailManager(session?.user.id, trail))) {
      return { title: "Shtegu nuk u gjet" };
    }
  }

  const description =
    trail.description ??
    `Shteg ${trail.difficulty} në ${trail.region ?? "Kosovë"}.`;
  return {
    title: `${trail.name}${trail.region ? ` — ${trail.region}` : ""}`,
    description,
    keywords: [
      trail.name,
      trail.region ?? "",
      trail.city ?? "",
      "hiking Kosovo",
      `${trail.name} trail`,
    ].filter(Boolean),
    alternates: { canonical: `https://hikeit.app/trails/${trail.slug}` },
    openGraph: {
      title: trail.name,
      description,
      type: "article",
      images: trail.coverImageUrl ? [{ url: trail.coverImageUrl }] : undefined,
    },
  };
}

function trailJsonLd(trail: Trail) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: trail.name,
    description: trail.description ?? undefined,
    geo:
      trail.startLat && trail.startLng
        ? {
            "@type": "GeoCoordinates",
            latitude: Number(trail.startLat),
            longitude: Number(trail.startLng),
          }
        : undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: "XK",
      addressRegion: trail.region ?? undefined,
      addressLocality: trail.city ?? undefined,
    },
    url: `https://hikeit.app/trails/${trail.slug}`,
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
        "text-summit/35 text-[10px] font-bold tracking-[0.15em] uppercase",
        accent && "border-moss border-l-[3px] pl-2.5",
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
  const isSaved = session
    ? await isTrailFavorited(session.user.id, trail.id)
    : false;

  const canUploadGpx = await isTrailManager(session?.user.id, trail);

  // Not publicly reachable until verified — only the submitter previewing
  // their own pending trail, or a super admin reviewing it, gets past here.
  if (!trail.verified && !canUploadGpx) notFound();

  const nearbyTrails = regionTrails
    .filter((t) => t.id !== trail.id)
    .slice(0, 3);
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(trailJsonLd(trail)) }}
      />
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
            alt={`${trail.name} — shteg alpin${trail.region ? ` në ${trail.region}` : ""}, Kosovë`}
            fallback="trail"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <div className="from-forest to-abyss absolute inset-0 bg-gradient-to-b" />
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
              <span className="border-moss text-moss border bg-[rgba(13,31,20,0.85)] px-2.5 py-1 text-[9px] font-bold tracking-[0.08em] uppercase">
                ✓ Verifikuar
              </span>
            ) : null}
          </div>

          <h1 className="font-heading text-summit mb-1.5 text-[clamp(24px,4vw,40px)] leading-[1.2] font-extrabold tracking-[-0.02em] uppercase">
            {trail.name}
          </h1>

          {locationLine ? (
            <p className="text-moss mb-4 text-[11px] font-semibold tracking-[0.08em] uppercase">
              {locationLine}
            </p>
          ) : null}

          {stats.length > 0 ? (
            <div className="flex flex-wrap">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={cn(
                    "border-summit/10 bg-summit/[0.06] border-y border-r px-4 py-2",
                    i === 0 && "border-l",
                  )}
                >
                  <p className="text-summit/30 mb-[3px] text-[8px] font-semibold tracking-[0.12em] uppercase">
                    {stat.label}
                  </p>
                  <p className="font-heading text-summit text-[13px] font-bold tracking-[-0.01em] uppercase">
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
          <div className="border-summit/10 relative mb-4 h-[260px] overflow-hidden border bg-[#0F2818]">
            <TrailMap
              trailName={trail.name}
              startLat={Number(trail.startLat)}
              startLng={Number(trail.startLng)}
              endLat={trail.endLat ? Number(trail.endLat) : null}
              endLng={trail.endLng ? Number(trail.endLng) : null}
              route={trail.gpxTrack ?? undefined}
            />
            {trail.elevationGainM != null ? (
              <span className="text-summit/60 pointer-events-none absolute top-2.5 right-2.5 z-[400] bg-[rgba(13,31,20,0.7)] px-2 py-[3px] text-[9px] font-semibold tracking-[0.08em] uppercase">
                {trail.elevationGainM}m Lartësia Max
              </span>
            ) : null}
          </div>

          {/* Elevation profile */}
          {trail.elevationProfile && trail.elevationProfile.length > 1 ? (
            <div className="border-summit/10 border p-4">
              <p className="text-summit/40 mb-3 text-[10px] font-bold tracking-[0.12em] uppercase">
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
            <p className="text-summit/40 mb-3 text-[10px] font-bold tracking-[0.12em] uppercase">
              Udhëtime të Ardhshme
            </p>
            {upcomingTrips.length > 0 ? (
              <div>
                {upcomingTrips.slice(0, 2).map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.slug}`}
                    className="border-summit/[0.06] block border-b pb-2.5 last:border-b-0 [&+a]:pt-2.5"
                  >
                    <p className="text-moss mb-[3px] text-[9px] font-bold tracking-[0.1em] uppercase">
                      {new Intl.DateTimeFormat("sq-AL", {
                        day: "numeric",
                        month: "long",
                      })
                        .format(trip.startDatetime)
                        .toUpperCase()}
                    </p>
                    <p className="font-heading text-summit text-[13px] font-bold tracking-[-0.01em] uppercase">
                      {trip.title}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-summit/35 text-xs">
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
                className="border-moss/30 bg-moss/[0.12] text-moss hover:bg-moss/20 flex flex-1 items-center justify-center gap-1.5 border px-4 py-2.5 text-[11px] font-bold tracking-[0.08em] uppercase transition-colors"
              >
                <Download className="size-3.5" />
                Shkarko GPX
              </a>
            ) : null}
            <TrailFavoriteButton
              trailId={trail.id}
              isSaved={isSaved}
              isLoggedIn={isLoggedIn}
              returnPath={`/trails/${trail.slug}`}
              className="size-[38px]"
            />
            <ShareButton
              title={`${trail.name} — HikeIt`}
              className="size-[38px]"
            />
          </div>

          {canUploadGpx ? (
            <div className="mt-3">
              <TrailGpxSection trailId={trail.id} />
            </div>
          ) : null}
        </aside>
      </div>

      {/* Description */}
      {paragraphs.length > 0 ? (
        <section className="mb-6 px-6">
          <SectionLabel accent>Përshkrimi</SectionLabel>
          <div className="mt-3.5 space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-summit/65 text-[13px] leading-[1.7]">
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
              <p className="text-summit/35 mb-2.5 text-[10px] font-bold tracking-[0.12em] uppercase">
                Sezonat më të mira
              </p>
              <div className="flex flex-wrap gap-1.5">
                {seasons.map((s) => (
                  <span
                    key={s}
                    className="border-moss/40 bg-moss/15 text-moss border px-3 py-[5px] text-[10px] font-bold tracking-[0.06em] uppercase"
                  >
                    {seasonLabels[s] ?? s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {features.length > 0 ? (
            <div>
              <p className="text-summit/35 mb-2.5 text-[10px] font-bold tracking-[0.12em] uppercase">
                Karakteristikat
              </p>
              <div className="flex flex-wrap gap-1.5">
                {features.map((f) => (
                  <span
                    key={f}
                    className="border-summit/12 bg-summit/[0.06] text-summit/55 border px-3 py-[5px] text-[10px] font-semibold tracking-[0.06em] uppercase"
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
        <section className="border-danger/25 bg-danger/[0.08] mx-6 mb-6 border px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="text-danger size-4" />
            <span className="text-danger text-[11px] font-bold tracking-[0.08em] uppercase">
              Kërkesa e Sigurisë
            </span>
          </div>
          <div className="grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
            {safety.map((item) => (
              <div key={item} className="flex items-start gap-1.5">
                <span className="bg-danger/60 mt-1.5 size-[3px] shrink-0" />
                <span className="text-summit/60 text-[11px] leading-[1.4] font-medium uppercase">
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
                <span className="font-heading text-summit text-xl font-extrabold">
                  {reviewData.average.toFixed(1)}
                </span>
                <Stars value={reviewData.average} size="size-3.5" />
              </div>
            ) : null}
          </div>
          {!isLoggedIn ? (
            <Link
              href="/login?redirect=/trails"
              className="border-summit/40 text-summit/60 hover:text-summit border px-3.5 py-2 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors"
            >
              Shto Vlerësim
            </Link>
          ) : null}
        </div>

        {reviewData.count === 0 ? (
          <p className="text-summit/40 text-xs">
            Bëhu i pari që vlerëson këtë shteg.
          </p>
        ) : (
          <div>
            {reviewData.reviews.map((review: TrailReview) => (
              <div
                key={review.id}
                className="border-summit/[0.06] border-b py-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <span className="bg-forest text-moss flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold">
                      {initials(review.userName)}
                    </span>
                    <div>
                      <p className="text-summit text-[13px] font-semibold">
                        {review.userName ?? "Anëtar"}
                      </p>
                      <p className="text-summit/30 text-[10px]">
                        {formatReviewDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Stars value={review.rating} size="size-3" />
                </div>
                {review.comment ? (
                  <p className="text-summit/60 mt-2.5 text-[12px] leading-[1.65]">
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
        <section className="border-summit/[0.08] border-t px-6 pt-8 pb-12">
          <p className="text-summit/35 mb-4 text-[10px] font-bold tracking-[0.15em] uppercase">
            Shtigjet tjera në rajon
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyTrails.map((t) => {
              const nb = DIFFICULTY_BADGE[t.difficulty];
              const dist = t.distanceKm
                ? Number(t.distanceKm).toFixed(1)
                : null;
              return (
                <Link
                  key={t.id}
                  href={`/trails/${t.slug}`}
                  className="border-summit/[0.08] overflow-hidden border"
                >
                  <div className="relative h-[140px] overflow-hidden">
                    <CloudImage
                      publicId={t.coverImageUrl}
                      size="thumbnail"
                      alt={`${t.name} — shteg alpin${t.region ? ` në ${t.region}` : ""}, Kosovë`}
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
                      <span className="border-moss text-moss absolute top-2 right-2 border bg-[rgba(13,31,20,0.85)] px-1.5 py-0.5 text-[8px] font-bold tracking-[0.08em] uppercase">
                        ✓
                      </span>
                    ) : null}
                  </div>
                  <div className="bg-summit/[0.02] p-3">
                    <h3 className="font-heading text-summit text-[13px] font-extrabold uppercase">
                      {t.name}
                    </h3>
                    <p className="text-summit/45 mt-1 text-[10px] font-medium">
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
