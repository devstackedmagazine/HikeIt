import {
  Building2,
  Calendar,
  Globe,
  Map,
  Mountain,
  Route,
  Share2,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/features/dashboard/stat-card";
import { WelcomeCard } from "@/components/features/dashboard/welcome-card";
import { CloudImage } from "@/components/features/images/cloud-image";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getRequiredUser, getUserAdminClub } from "@/lib/auth/helpers";
import type { Trail } from "@/lib/db/schema";
import { formatTripDate } from "@/lib/utils/datetime";
import type { ClubWithStats } from "@/server/queries/clubs";
import { getClubs, getClubStats } from "@/server/queries/clubs";
import { getHikerStats } from "@/server/queries/dashboard";
import { getFeaturedTrails } from "@/server/queries/trails";
import {
  getUpcomingTripsByClub,
  getUserRegistrations,
} from "@/server/queries/trips";

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
  "bg-pine text-moss",
];

function SuggestedTrailCard({ trail }: { trail: Trail }) {
  return (
    <Link
      href={`/trails/${trail.slug}`}
      className="overflow-hidden border border-forest/12 bg-summit"
    >
      <div className="relative h-[120px] overflow-hidden">
        <CloudImage
          publicId={trail.coverImageUrl}
          size="cover"
          alt={trail.name}
          fallback="trail"
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/40 to-transparent" />
      </div>
      <div className="p-2.5">
        <h3 className="font-heading mb-1.5 text-xs font-extrabold tracking-[-0.01em] text-forest uppercase">
          {trail.name}
        </h3>
        <div className="flex gap-4">
          {trail.distanceKm ? (
            <div>
              <p className="text-[8px] font-semibold tracking-[0.1em] text-forest/40 uppercase">
                Distanca
              </p>
              <p className="font-heading text-xs font-bold text-forest">
                {Number(trail.distanceKm)} KM
              </p>
            </div>
          ) : null}
          {trail.elevationGainM != null ? (
            <div>
              <p className="text-[8px] font-semibold tracking-[0.1em] text-forest/40 uppercase">
                Lartësia
              </p>
              <p className="font-heading text-xs font-bold text-forest">
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
    <div className="flex flex-col items-center border border-forest/12 bg-summit p-4 text-center">
      <span
        className={`mb-2.5 flex size-12 items-center justify-center ${CLUB_ICONS[index % CLUB_ICONS.length]}`}
      >
        <Mountain className="size-6" />
      </span>
      <h3 className="font-heading mb-1.5 text-[13px] font-extrabold tracking-[-0.01em] text-forest uppercase">
        {club.name}
      </h3>
      {club.description ? (
        <p className="mb-3 line-clamp-2 text-[11px] leading-[1.5] text-forest/50">
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
    <footer className="mt-8 bg-abyss px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-heading text-sm font-extrabold text-summit/30 uppercase">
          HikeIt
        </span>
        <div className="flex flex-wrap gap-5">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-[10px] font-medium tracking-[0.06em] text-summit/40 uppercase transition-colors hover:text-summit/70"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          {[Globe, Share2].map((Icon, i) => (
            <span
              key={i}
              className="flex size-[26px] items-center justify-center border border-summit/12 bg-summit/[0.05] text-summit/45"
            >
              <Icon className="size-3.5" />
            </span>
          ))}
        </div>
      </div>
      <p className="mt-4 border-t border-summit/[0.06] pt-3.5 text-[10px] tracking-[0.08em] text-summit/20 uppercase">
        © 2024 HIKEIT BALKANS. FORGED IN THE PEAKS.
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
              <span className="bg-moss px-2 py-[3px] text-[9px] font-bold tracking-[0.08em] text-abyss uppercase">
                Organizimet
              </span>
              <span className="text-[11px] font-bold tracking-[0.06em] text-forest uppercase">
                Udhëtimet Ardhshme
              </span>
            </div>
            <Link
              href="/dashboard/my-trips"
              className="text-[10px] font-semibold tracking-[0.06em] text-moss uppercase transition-opacity hover:opacity-70"
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
                    className={`border border-l-4 border-forest/12 bg-summit p-3.5 ${TRIP_ACCENTS[i % TRIP_ACCENTS.length]}`}
                  >
                    <p className="font-heading mb-2.5 text-[13px] leading-[1.2] font-extrabold tracking-[-0.01em] text-forest uppercase">
                      {reg.trip.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-forest/50 uppercase">
                        <Calendar className="size-[11px] text-forest/40" />
                        {shortDate(reg.trip.startDatetime)}
                      </span>
                      <span
                        className={`font-heading text-xs font-bold ${free ? "text-moss" : "text-forest"}`}
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
            <h2 className="mb-3 text-[11px] font-bold tracking-[0.06em] text-forest uppercase">
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
            <h2 className="mb-3 text-[11px] font-bold tracking-[0.06em] text-forest uppercase">
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
        <h1 className="font-heading text-2xl font-extrabold text-forest uppercase">
          Mirë se vjen, {getFirstName(name)}! 👋
        </h1>
        <EmptyState
          icon={Building2}
          title="Ende pa klub"
          description="Krijo klubin tënd për të filluar organizimin e udhëtimeve."
          action={{ label: "Krijo klubin tënd", href: "/dashboard/club/create" }}
        />
      </div>
    );
  }

  const [stats, upcoming] = await Promise.all([
    getClubStats(club.id),
    getUpcomingTripsByClub(club.id, 3),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-forest uppercase">
            Mirë se vjen, {getFirstName(name)}! 👋
          </h1>
          <p className="text-sm text-forest/50">{club.name}</p>
        </div>
        <Button render={<Link href={`/dashboard/club/${club.slug}`} />}>
          <Building2 />
          Paneli i klubit
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Anëtarë"
          value={stats.memberCount}
          hint={
            stats.membersThisMonth > 0
              ? `+${stats.membersThisMonth} këtë muaj`
              : undefined
          }
        />
        <StatCard
          icon={Calendar}
          label="Udhëtime aktive"
          value={stats.activeTrips}
        />
        <StatCard icon={Route} label="Të kryera" value={stats.completedTrips} />
        <StatCard
          icon={TrendingUp}
          label="Të ardhura"
          value={`€${stats.revenue}`}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-bold tracking-[0.06em] text-forest uppercase">
            Udhëtimet e ardhshme
          </h2>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/dashboard/club/${club.slug}/trips/create`} />}
          >
            Krijo udhëtim
          </Button>
        </div>
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((trip) => (
              <Link
                key={trip.id}
                href={`/dashboard/club/${club.slug}/trips/${trip.slug}`}
                className="flex items-center justify-between border border-forest/12 bg-summit p-4 transition-colors hover:bg-mist"
              >
                <div>
                  <p className="font-medium text-forest">{trip.title}</p>
                  <p className="text-sm text-forest/50">
                    {formatTripDate(trip.startDatetime)}
                  </p>
                </div>
                <Map className="size-5 text-forest/40" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="Asnjë udhëtim aktiv"
            description="Krijo udhëtimin e parë për anëtarët e klubit."
            action={{
              label: "Krijo udhëtim",
              href: `/dashboard/club/${club.slug}/trips/create`,
            }}
          />
        )}
      </section>
    </div>
  );
}
