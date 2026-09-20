import {
  Building2,
  Calendar,
  Check,
  Globe,
  Mountain,
  Pencil,
  PersonStanding,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { StatCard } from "@/components/features/dashboard/stat-card";
import { WelcomeCard } from "@/components/features/dashboard/welcome-card";
import { CloudImage } from "@/components/features/images/cloud-image";
import { EmptyState } from "@/components/shared/empty-state";
import { getRequiredUser, getUserAdminClub } from "@/lib/auth/helpers";
import type { Trail, Trip } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";
import type { ClubWithStats } from "@/server/queries/clubs";
import { getClubs, getClubStats } from "@/server/queries/clubs";
import { getClubDashboard, getHikerStats } from "@/server/queries/dashboard";
import { getFeaturedTrails } from "@/server/queries/trails";
import { getUserRegistrations } from "@/server/queries/trips";

const getFirstName = (displayName: string) =>
  displayName.trim().split(" ")[0] ?? displayName;

function shortDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", { day: "numeric", month: "short" })
    .format(date)
    .toUpperCase();
}

export default async function DashboardPage() {
  const user = await getRequiredUser();
  const displayName = user.name ?? "hiker";

  if (user.role === "club_admin") {
    return <ClubAdminHome userId={user.id} name={displayName} />;
  }
  return <HikerHome userId={user.id} name={displayName} />;
}

const TRIP_ACCENTS = ["border-l-forest", "border-l-sunset", "border-l-moss"];

const CLUB_ICONS = [
  "bg-forest text-moss",
  "bg-moss text-abyss",
  "bg-abyss text-moss",
];

function SuggestedTrailCard({ trail }: { trail: Trail }) {
  return (
    <Link
      href={`/trails/${trail.slug}`}
      className="border-forest/12 bg-summit overflow-hidden border"
    >
      <div className="relative h-[120px] overflow-hidden">
        <CloudImage
          publicId={trail.coverImageUrl}
          size="cover"
          alt={trail.name}
          fallback="trail"
          className="h-full w-full"
        />
        <div className="from-forest/40 absolute inset-0 bg-gradient-to-t to-transparent" />
      </div>
      <div className="p-2.5">
        <h3 className="font-heading text-forest mb-1.5 text-xs font-extrabold tracking-[-0.01em] uppercase">
          {trail.name}
        </h3>
        <div className="flex gap-4">
          {trail.distanceKm ? (
            <div>
              <p className="text-forest/70 text-[8px] font-semibold tracking-[0.1em] uppercase">
                Distanca
              </p>
              <p className="font-heading text-forest text-xs font-bold">
                {Number(trail.distanceKm)} KM
              </p>
            </div>
          ) : null}
          {trail.elevationGainM != null ? (
            <div>
              <p className="text-forest/70 text-[8px] font-semibold tracking-[0.1em] uppercase">
                Lartësia
              </p>
              <p className="font-heading text-forest text-xs font-bold">
                {trail.elevationGainM.toLocaleString("en-US")} M
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function DiscoverClubCard({
  club,
  index,
}: {
  club: ClubWithStats;
  index: number;
}) {
  const featured = index === 1;
  return (
    <div className="border-forest/12 bg-summit flex flex-col items-center border p-4 text-center">
      <span
        className={`mb-2.5 flex size-12 items-center justify-center ${CLUB_ICONS[index % CLUB_ICONS.length]}`}
      >
        <Mountain className="size-6" />
      </span>
      <h3 className="font-heading text-forest mb-1.5 text-[13px] font-extrabold tracking-[-0.01em] uppercase">
        {club.name}
      </h3>
      {club.description ? (
        <p className="text-forest/70 mb-3 line-clamp-2 text-[11px] leading-[1.5]">
          {club.description}
        </p>
      ) : null}
      <Link
        href={`/clubs/${club.slug}`}
        className={`mt-auto block w-full py-2.5 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors ${
          featured
            ? "bg-moss text-abyss hover:bg-pine hover:text-summit"
            : "bg-forest text-summit hover:bg-abyss"
        }`}
      >
        Shiko Klubin →
      </Link>
    </div>
  );
}

function DashboardFooter() {
  const links = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Trail Safety", href: "#" },
    { label: "Contact Basecamp", href: "mailto:hello@hikeit.app" },
    { label: "Terms of Service", href: "/terms" },
  ];
  return (
    <footer className="bg-abyss mt-8 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-heading text-summit/50 flex items-center gap-2 text-sm font-extrabold uppercase">
          <Image
            src="/logos/Hikeit-pfp.png"
            alt=""
            width={20}
            height={20}
            className="size-5 opacity-60"
          />
          HikeIt
        </span>
        <div className="flex flex-wrap gap-5">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-summit/50 hover:text-summit/70 text-[10px] font-medium tracking-[0.06em] uppercase transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          {[Globe, Share2].map((Icon, i) => (
            <span
              key={i}
              className="border-summit/12 bg-summit/[0.05] text-summit/45 flex size-[26px] items-center justify-center border"
            >
              <Icon className="size-3.5" />
            </span>
          ))}
        </div>
      </div>
      <p className="border-summit/[0.06] text-summit/50 mt-4 border-t pt-3.5 text-[10px] tracking-[0.08em] uppercase">
        © 2026 HIKEIT BALKANS. FORGED IN THE PEAKS.
      </p>
    </footer>
  );
}

async function HikerHome({ userId, name }: { userId: string; name: string }) {
  const [stats, upcoming, suggested, clubsResult] = await Promise.all([
    getHikerStats(userId),
    getUserRegistrations(userId, "upcoming"),
    getFeaturedTrails(3),
    getClubs({ limit: 3 }),
  ]);

  return (
    <div className="-mx-6 -mb-24 md:-mb-5">
      <div className="px-6">
        <WelcomeCard firstName={getFirstName(name)} />

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Udhëtime" value={stats.tripsJoined} />
          <StatCard label="Klube" value={stats.clubsJoined} />
          <StatCard label="Vlerësime" value={stats.trailsReviewed} />
          <StatCard label="Distancë" value={`${stats.totalKm} KM`} />
        </div>

        {/* Upcoming trips */}
        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-moss text-abyss px-2 py-[3px] text-[9px] font-bold tracking-[0.08em] uppercase">
                Organizimet
              </span>
              <span className="text-forest text-[11px] font-bold tracking-[0.06em] uppercase">
                Udhëtimet Ardhshme
              </span>
            </div>
            <Link
              href="/dashboard/my-trips"
              className="text-pine text-[10px] font-semibold tracking-[0.06em] uppercase transition-opacity hover:opacity-70"
            >
              Shiko të gjitha →
            </Link>
          </div>

          {upcoming.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.slice(0, 3).map((reg, i) => {
                const free = Number(reg.trip.priceEur) === 0;
                return (
                  <Link
                    key={reg.registrationId}
                    href={`/trips/${reg.trip.slug}`}
                    className={`border-forest/12 bg-summit border border-l-4 p-3.5 ${TRIP_ACCENTS[i % TRIP_ACCENTS.length]}`}
                  >
                    <p className="font-heading text-forest mb-2.5 text-[13px] leading-[1.2] font-extrabold tracking-[-0.01em] uppercase">
                      {reg.trip.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-forest/50 flex items-center gap-1.5 text-[10px] font-medium uppercase">
                        <Calendar className="text-forest/40 size-[11px]" />
                        {shortDate(reg.trip.startDatetime)}
                      </span>
                      <span
                        className={`font-heading text-xs font-bold ${free ? "text-pine" : "text-forest"}`}
                      >
                        {free ? "FALAS" : `€${Number(reg.trip.priceEur)}`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Mountain}
              title="Ende pa udhëtime"
              description="Gjej udhëtimin tënd të parë dhe nis aventurën."
              action={{ label: "Gjej udhëtime", href: "/trips" }}
            />
          )}
        </section>

        {/* Suggested trails */}
        {suggested.length > 0 ? (
          <section className="mb-5">
            <h2 className="text-forest mb-3 text-[11px] font-bold tracking-[0.06em] uppercase">
              Shtigjet e Sugjeruara
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {suggested.map((trail) => (
                <SuggestedTrailCard key={trail.id} trail={trail} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Discover clubs */}
        {clubsResult.clubs.length > 0 ? (
          <section>
            <h2 className="text-forest mb-3 text-[11px] font-bold tracking-[0.06em] uppercase">
              Zbuloni Klubet
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clubsResult.clubs.map((club, i) => (
                <DiscoverClubCard key={club.id} club={club} index={i} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <DashboardFooter />
    </div>
  );
}

async function ClubAdminHome({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const club = await getUserAdminClub(userId);

  if (!club) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="font-heading text-forest text-2xl font-extrabold uppercase">
          Mirë se vjen, {getFirstName(name)}! 👋
        </h1>
        <EmptyState
          icon={Building2}
          title="Ende pa klub"
          description="Krijo klubin tënd për të filluar organizimin e udhëtimeve."
          action={{
            label: "Krijo klubin tënd",
            href: "/dashboard/club/create",
          }}
        />
      </div>
    );
  }

  const [stats, dashboard] = await Promise.all([
    getClubStats(club.id),
    getClubDashboard(club.id),
  ]);

  const priorMembers = stats.memberCount - stats.membersThisMonth;
  const growthPct =
    stats.membersThisMonth > 0
      ? priorMembers > 0
        ? Math.round((stats.membersThisMonth / priorMembers) * 100)
        : 100
      : 0;

  return (
    <div className="space-y-4">
      {/* Welcome club card */}
      <div className="border-summit/10 bg-summit/[0.04] flex items-start justify-between gap-4 border p-5">
        <div>
          <p className="text-summit/60 mb-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase">
            Mirë se vjen
          </p>
          <h1 className="font-heading text-summit mb-2.5 text-[clamp(20px,3vw,32px)] leading-[1.2] font-extrabold tracking-[-0.02em] uppercase">
            {club.name}
          </h1>
          <p className="text-summit/70 max-w-[380px] text-xs leading-[1.65]">
            Menaxhoni ekspeditat tuaja, anëtarët dhe rritjen e komunitetit nga
            një qendër e vetme <span className="text-sage">alpine</span>.
          </p>
        </div>
        <span className="border-summit/10 bg-abyss text-moss flex size-20 shrink-0 items-center justify-center border">
          <Mountain className="size-9" />
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStat label="Anëtarë" value={stats.memberCount}>
          {growthPct > 0 ? (
            <span className="text-moss text-[11px] font-semibold">
              +{growthPct}%
            </span>
          ) : null}
        </AdminStat>
        <AdminStat label="Udhëtime aktive" value={stats.activeTrips}>
          <PersonStanding className="text-summit/35 size-3.5" />
        </AdminStat>
        <AdminStat label="Të përfunduara" value={stats.completedTrips}>
          <Check className="text-summit/35 size-3.5" />
        </AdminStat>
        <div className="border-summit/8 bg-summit/[0.04] border p-4">
          <p className="text-summit/60 mb-1.5 text-[9px] font-semibold tracking-[0.12em] uppercase">
            Të pritura
          </p>
          <p className="font-heading text-sunset text-[28px] leading-none font-extrabold">
            €{stats.expectedRevenue}
            <span className="text-summit/60 ml-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase">
              Arkëtoni vetë
            </span>
          </p>
        </div>
      </div>

      {/* Two-column */}
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        {/* Trips table */}
        <div className="border-summit/8 bg-summit/[0.03] border">
          <div className="flex items-center justify-between px-4 py-3.5">
            <h2 className="text-summit/70 text-[11px] font-bold tracking-[0.08em] uppercase">
              Udhëtimet ardhshme
            </h2>
            <Link
              href={`/dashboard/club/${club.slug}/trips/create`}
              className="border-moss bg-moss text-abyss hover:bg-sage border-2 px-3.5 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase transition-colors"
            >
              Krijo udhëtim →
            </Link>
          </div>

          {dashboard.upcomingTrips.length > 0 ? (
            <div>
              <div className="border-summit/8 bg-summit/[0.04] text-summit/60 grid grid-cols-[2fr_1.5fr_1fr_1fr_0.5fr] gap-2 border-y px-4 py-2 text-[9px] font-semibold tracking-[0.1em] uppercase">
                <span>Titulli</span>
                <span>Data</span>
                <span>Regj/Max</span>
                <span>Status</span>
                <span className="text-right">Veprime</span>
              </div>
              {dashboard.upcomingTrips.map(({ trip, confirmedCount }) => (
                <div
                  key={trip.id}
                  className="border-summit/[0.05] grid grid-cols-[2fr_1.5fr_1fr_1fr_0.5fr] items-center gap-2 border-b px-4 py-2.5"
                >
                  <span className="font-heading text-summit text-xs leading-[1.2] font-bold uppercase">
                    {trip.title}
                  </span>
                  <span className="text-summit/70 text-[10px] font-medium uppercase">
                    {formatAdminDate(trip.startDatetime)}
                  </span>
                  <span className="text-summit/60 text-[11px] font-semibold">
                    {confirmedCount}/{trip.maxParticipants ?? "∞"}
                  </span>
                  <StatusDot status={trip.status} />
                  <Link
                    href={`/dashboard/club/${club.slug}/trips/${trip.slug}/edit`}
                    aria-label="Ndrysho"
                    className="text-summit/60 hover:text-moss flex justify-end"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-summit/70 px-4 py-8 text-center text-xs">
              Asnjë udhëtim aktiv. Krijoni të parin.
            </p>
          )}
        </div>

        {/* Recent registrations */}
        <div className="border-summit/8 bg-summit/[0.03] border p-3.5">
          <p className="text-summit/70 mb-3.5 text-[10px] font-bold tracking-[0.1em] uppercase">
            Regjistrimet e fundit
          </p>
          {dashboard.recentRegistrations.length > 0 ? (
            <div>
              {dashboard.recentRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="border-summit/[0.05] flex items-center gap-2.5 border-b py-2 last:border-b-0"
                >
                  <span className="bg-pine text-moss flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                    {initials(reg.userName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-summit truncate text-[11px] font-bold">
                      {reg.userName ?? "Anëtar"}
                    </p>
                    <p className="text-summit/60 truncate text-[9px] uppercase">
                      {reg.tripTitle}
                    </p>
                  </div>
                  <span className="text-summit/60 shrink-0 text-[9px] font-medium uppercase">
                    {timeAgo(reg.registeredAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-summit/70 py-4 text-center text-xs">
              Ende pa regjistrime.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminStat({
  label,
  value,
  children,
}: {
  label: string;
  value: number;
  children?: ReactNode;
}) {
  return (
    <div className="border-summit/8 bg-summit/[0.04] border p-4">
      <p className="text-summit/60 mb-1.5 text-[9px] font-semibold tracking-[0.12em] uppercase">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-summit text-[28px] leading-none font-extrabold">
          {value}
        </span>
        {children}
      </div>
    </div>
  );
}

const ADMIN_STATUS: Record<
  Trip["status"],
  { dot: string; text: string; label: string }
> = {
  open: { dot: "bg-moss", text: "text-summit/60", label: "Hapur" },
  full: { dot: "bg-danger", text: "text-danger", label: "Plotë" },
  draft: { dot: "bg-alert", text: "text-alert", label: "Draft" },
  in_progress: { dot: "bg-moss", text: "text-summit/60", label: "Në vazhdim" },
  completed: { dot: "bg-summit/40", text: "text-summit/50", label: "Kryer" },
  canceled: { dot: "bg-danger", text: "text-danger", label: "Anuluar" },
};

function StatusDot({ status }: { status: Trip["status"] }) {
  const s = ADMIN_STATUS[status];
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-[9px] font-bold uppercase",
        s.text,
      )}
    >
      <span className={cn("size-1", s.dot)} />
      {s.label}
    </span>
  );
}

function formatAdminDate(date: Date): string {
  const dm = new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "long",
  }).format(date);
  return `${dm}, ${date.getFullYear()}`.toUpperCase();
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

function timeAgo(date: Date): string {
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (mins < 60) return `${mins} MIN`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ORË`;
  return `${Math.round(hours / 24)} DITË`;
}
