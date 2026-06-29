import { Eye, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createSearchParamsCache,
  createSerializer,
  type SearchParams,
} from "nuqs/server";

import { ClubTripsFilter } from "@/components/features/trips/club-trips-filter";
import { getRequiredUser, requireClubAdmin } from "@/lib/auth/helpers";
import type { Trip } from "@/lib/db/schema";
import { clubTripsParsers } from "@/lib/search-params/club-trips";
import { cn } from "@/lib/utils/cn";
import { getClubStats } from "@/server/queries/clubs";
import { getClubTripsAdmin } from "@/server/queries/dashboard";

export const metadata: Metadata = { title: "Udhëtimet — Paneli i klubit" };

const cache = createSearchParamsCache(clubTripsParsers);
const serialize = createSerializer(clubTripsParsers);
const LIMIT = 10;

const STATUS_BADGE: Record<Trip["status"], { className: string; label: string }> =
  {
    open: { className: "bg-moss text-abyss", label: "Hapur" },
    full: { className: "bg-moss text-abyss", label: "Plotë" },
    in_progress: { className: "bg-moss text-abyss", label: "Në vazhdim" },
    draft: {
      className: "border border-forest/30 text-forest/60",
      label: "Draft",
    },
    completed: {
      className: "border border-forest/20 bg-forest/10 text-forest",
      label: "Përfunduar",
    },
    canceled: { className: "bg-danger text-summit", label: "Anuluar" },
  };

function formatDate(date: Date): string {
  const dm = new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "short",
  }).format(date);
  return `${dm}, ${date.getFullYear()}`.toUpperCase();
}

const GRID = "grid grid-cols-[2fr_1.5fr_1fr_1.2fr_1fr_0.8fr_0.8fr] items-center gap-2";

export default async function ClubTripsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const user = await getRequiredUser();
  const access = await requireClubAdmin(user.id, slug);
  if (!access) notFound();

  const club = access.organization;
  const filters = await cache.parse(searchParams);

  const [{ rows, total }, stats] = await Promise.all([
    getClubTripsAdmin(club.id, {
      status: (filters.status || undefined) as Trip["status"] | undefined,
      page: filters.page,
      limit: LIMIT,
    }),
    getClubStats(club.id),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const currentPage = Math.min(filters.page, totalPages);
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * LIMIT + 1;
  const rangeEnd = Math.min(currentPage * LIMIT, total);
  const createHref = `/dashboard/club/${club.slug}/trips/create`;

  return (
    <div>
      {/* Header */}
      <p className="mb-2 text-[10px] font-medium tracking-[0.08em] text-forest/40 uppercase">
        <Link href={`/dashboard/club/${club.slug}`} className="hover:text-forest">
          Paneli i klubit
        </Link>
      </p>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-heading max-w-[12ch] text-[clamp(32px,5vw,56px)] leading-[0.95] font-extrabold tracking-[-0.04em] text-forest uppercase">
          {club.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          <span className="border border-forest/15 bg-forest/[0.08] px-3 py-1.5 text-[9px] font-bold tracking-[0.08em] text-forest uppercase">
            Statistikat e sotme
          </span>
          <span className="bg-moss px-3 py-1.5 text-[9px] font-bold tracking-[0.08em] text-abyss uppercase">
            Aktive: {stats.activeTrips} Udhëtime
          </span>
        </div>
      </div>

      {/* Filter + create */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="font-heading text-sm font-extrabold tracking-[-0.01em] text-forest uppercase">
            Të gjitha udhëtimet
          </h2>
          <ClubTripsFilter />
        </div>
        <Link
          href={createHref}
          className="bg-moss px-5 py-3 text-xs font-extrabold tracking-[0.08em] text-abyss uppercase transition-colors hover:bg-pine hover:text-summit"
        >
          Krijo udhëtim të ri →
        </Link>
      </div>

      {/* Table */}
      <div className="border border-forest/12 bg-summit">
        <div
          className={cn(
            GRID,
            "bg-forest px-4 py-2.5 text-[10px] font-bold tracking-[0.1em] text-summit uppercase",
          )}
        >
          <span>Titulli</span>
          <span>Shtegu</span>
          <span>Data</span>
          <span>Status</span>
          <span>Regj./Max</span>
          <span>Çmimi</span>
          <span className="text-right">Veprime</span>
        </div>

        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-forest/40">
            Asnjë udhëtim. Krijoni të parin.
          </p>
        ) : (
          rows.map(({ trip, trailName, confirmedCount }) => {
            const badge = STATUS_BADGE[trip.status];
            return (
              <div
                key={trip.id}
                className={cn(
                  GRID,
                  "border-b border-forest/[0.06] px-4 py-3 transition-colors last:border-b-0 hover:bg-forest/[0.03]",
                )}
              >
                <span className="font-heading text-xs leading-[1.2] font-bold tracking-[-0.01em] text-forest uppercase">
                  {trip.title}
                </span>
                <span className="text-[11px] leading-[1.3] text-forest/55 italic">
                  {trailName ?? "—"}
                </span>
                <span className="text-[10px] font-semibold text-forest/60 uppercase">
                  {formatDate(trip.startDatetime)}
                </span>
                <span>
                  <span
                    className={cn(
                      "inline-block px-2.5 py-1 text-[9px] font-extrabold tracking-[0.06em] uppercase",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                </span>
                <span className="text-xs font-semibold text-forest">
                  {confirmedCount}/{trip.maxParticipants ?? "∞"}
                </span>
                <span className="font-heading text-xs font-bold text-forest">
                  €{Number(trip.priceEur).toFixed(2)}
                </span>
                <span className="flex justify-end gap-1.5">
                  <Link
                    href={`/dashboard/club/${club.slug}/trips/${trip.slug}`}
                    aria-label="Shiko"
                    className="text-forest/40 hover:text-forest"
                  >
                    <Eye className="size-3.5" />
                  </Link>
                  <Link
                    href={`/dashboard/club/${club.slug}/trips/${trip.slug}/edit`}
                    aria-label="Ndrysho"
                    className="text-forest/40 hover:text-forest"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-forest/[0.08] pt-3.5">
        <span className="text-[10px] font-medium tracking-[0.04em] text-forest/40 uppercase">
          Duke treguar {rangeStart} - {rangeEnd} nga {total} udhëtime
        </span>
        {totalPages > 1 ? (
          <div className="flex gap-1">
            <PageLink
              href={`/dashboard/club/${club.slug}/trips${serialize({ ...filters, page: Math.max(1, currentPage - 1) })}`}
              disabled={currentPage <= 1}
              label="‹"
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PageLink
                key={p}
                href={`/dashboard/club/${club.slug}/trips${serialize({ ...filters, page: p })}`}
                active={p === currentPage}
                label={String(p)}
              />
            ))}
            <PageLink
              href={`/dashboard/club/${club.slug}/trips${serialize({ ...filters, page: Math.min(totalPages, currentPage + 1) })}`}
              disabled={currentPage >= totalPages}
              label="›"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PageLink({
  href,
  label,
  active,
  disabled,
}: {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      className={cn(
        "flex size-7 items-center justify-center border text-xs font-semibold transition-colors",
        active
          ? "border-forest bg-forest text-summit"
          : "border-forest/15 text-forest/50 hover:bg-forest/[0.06]",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      {label}
    </Link>
  );
}
