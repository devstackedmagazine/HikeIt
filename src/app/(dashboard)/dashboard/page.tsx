import {
  Building2,
  Calendar,
  CheckCircle2,
  Map,
  Mountain,
  Route,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/features/dashboard/stat-card";
import { TrailCard } from "@/components/features/trails/trail-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getRequiredUser, getUserAdminClub } from "@/lib/auth/helpers";
import { formatTripDate } from "@/lib/utils/datetime";
import { getClubs } from "@/server/queries/clubs";
import { getClubStats } from "@/server/queries/clubs";
import { getHikerStats } from "@/server/queries/dashboard";
import { getFeaturedTrails } from "@/server/queries/trails";
import {
  getUpcomingTripsByClub,
  getUserRegistrations,
} from "@/server/queries/trips";

export default async function DashboardPage() {
  const user = await getRequiredUser();
  const displayName = user.name ?? "hiker";

  if (user.role === "club_admin") {
    return <ClubAdminHome userId={user.id} name={displayName} />;
  }
  return <HikerHome userId={user.id} name={displayName} />;
}

async function HikerHome({ userId, name }: { userId: string; name: string }) {
  const [stats, upcoming, suggested, clubsResult] = await Promise.all([
    getHikerStats(userId),
    getUserRegistrations(userId, "upcoming"),
    getFeaturedTrails(3),
    getClubs({ limit: 3 }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Mirë se vini, {name}! 👋
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Udhëtime" value={stats.tripsJoined} />
        <StatCard icon={Users} label="Klube" value={stats.clubsJoined} />
        <StatCard icon={Star} label="Vlerësime" value={stats.trailsReviewed} />
        <StatCard
          icon={TrendingUp}
          label="Km gjithsej"
          value={`${stats.totalKm}`}
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Udhëtimet e ardhshme</h2>
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((reg) => (
              <Link
                key={reg.registrationId}
                href={`/trips/${reg.trip.slug}`}
                className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{reg.trip.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {reg.club.name} · {formatTripDate(reg.trip.startDatetime)}
                  </p>
                </div>
                <CheckCircle2 className="size-5 text-primary" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Mountain}
            title="Ende pa udhëtime"
            description="Gjej udhëtimin tënd të parë dhe nis aventurën."
            action={{ label: "Gjej udhëtimin tënd të parë", href: "/trips" }}
          />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Shtigje të sugjeruara</h2>
          <Link
            href="/trails"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Të gjitha
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {suggested.map((trail) => (
            <TrailCard key={trail.id} trail={trail} />
          ))}
        </div>
      </section>

      {clubsResult.clubs.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Zbulo klube</h2>
            <Link
              href="/clubs"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Të gjitha
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {clubsResult.clubs.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.slug}`}
                className="rounded-xl border p-4 transition-colors hover:bg-muted"
              >
                <p className="font-medium">{club.name}</p>
                <p className="text-sm text-muted-foreground">
                  {club.city} · {club.memberCount} anëtarë
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
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
        <h1 className="text-2xl font-bold tracking-tight">
          Mirë se vini, {name}! 👋
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
          <h1 className="text-2xl font-bold tracking-tight">
            Mirë se vini, {name}! 👋
          </h1>
          <p className="text-muted-foreground">{club.name}</p>
        </div>
        <Button render={<Link href={`/dashboard/club/${club.slug}`} />}>
          <Building2 />
          Paneli i klubit
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
        <StatCard icon={Calendar} label="Udhëtime aktive" value={stats.activeTrips} />
        <StatCard icon={Route} label="Të kryera" value={stats.completedTrips} />
        <StatCard
          icon={TrendingUp}
          label="Të ardhura"
          value={`€${stats.revenue}`}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Udhëtimet e ardhshme</h2>
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/dashboard/club/${club.slug}/trips/create`} />
            }
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
                className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{trip.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTripDate(trip.startDatetime)}
                  </p>
                </div>
                <Map className="size-5 text-muted-foreground" />
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
