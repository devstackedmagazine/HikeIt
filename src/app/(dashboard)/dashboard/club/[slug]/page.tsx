import { Calendar, Route, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClubMembersTable } from "@/components/features/clubs/club-members-table";
import { ClubSettings } from "@/components/features/clubs/club-settings";
import { ClubTripsTable } from "@/components/features/clubs/club-trips-table";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRequiredUser, requireClubAdmin } from "@/lib/auth/helpers";
import { tripStatusLabels } from "@/lib/i18n/labels";
import { formatTripDate } from "@/lib/utils/datetime";
import {
  getClubActivity,
  getClubMembers,
  getClubStats,
} from "@/server/queries/clubs";
import { getClubTrips } from "@/server/queries/trips";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Paneli — ${slug}` };
}

const ACTION_LABELS: Record<string, string> = {
  "club.created": "Klubi u krijua",
  "trip.created": "Udhëtim u krijua",
  "trip.registered": "Anëtar i ri u regjistrua",
  "trip.canceled": "Udhëtim u anulua",
};

const TABS = ["overview", "trips", "members", "settings"] as const;

export default async function ClubAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab: tabParam } = await searchParams;
  const tab = TABS.find((t) => t === tabParam) ?? "overview";
  const user = await getRequiredUser();
  const access = await requireClubAdmin(user.id, slug);
  if (!access) notFound();

  const club = access.organization;
  const [stats, tripsResult, membersResult, activity] = await Promise.all([
    getClubStats(club.id),
    getClubTrips(club.id, { limit: 50 }),
    getClubMembers(club.id, { limit: 100 }),
    getClubActivity(club.id, 10),
  ]);

  const upcoming = tripsResult.trips
    .filter((t) => t.status === "open")
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
        <p className="text-muted-foreground">{club.city}</p>
      </div>

      <Tabs key={tab} defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="overview">Përmbledhje</TabsTrigger>
          <TabsTrigger value="trips">Udhëtimet</TabsTrigger>
          <TabsTrigger value="members">Anëtarët</TabsTrigger>
          <TabsTrigger value="settings">Cilësimet</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-6">
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
            <StatCard
              icon={Calendar}
              label="Udhëtime aktive"
              value={stats.activeTrips}
            />
            <StatCard
              icon={Route}
              label="Të kryera"
              value={stats.completedTrips}
            />
            <StatCard
              icon={TrendingUp}
              label="Të ardhura"
              value={`€${stats.revenue}`}
            />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Udhëtimet e ardhshme</h2>
            {upcoming.length > 0 ? (
              <div className="space-y-2">
                {upcoming.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/dashboard/club/${slug}/trips/${trip.slug}`}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="font-medium">{trip.title}</span>
                    <span className="flex items-center gap-3 text-muted-foreground">
                      {formatTripDate(trip.startDatetime)}
                      <Badge variant="secondary">
                        {tripStatusLabels[trip.status]}
                      </Badge>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Asnjë udhëtim aktiv.
              </p>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Aktiviteti i fundit</h2>
            {activity.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {activity.map((log) => (
                  <li
                    key={log.id}
                    className="flex justify-between border-b pb-2 text-muted-foreground"
                  >
                    <span>{ACTION_LABELS[log.action] ?? log.action}</span>
                    <span>{formatTripDate(log.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Asnjë aktivitet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trips" className="pt-6">
          <ClubTripsTable trips={tripsResult.trips} clubSlug={slug} />
        </TabsContent>

        <TabsContent value="members" className="pt-6">
          <ClubMembersTable
            members={membersResult.members}
            clubSlug={slug}
            canManage={access.role === "admin"}
            currentUserId={user.id}
          />
        </TabsContent>

        <TabsContent value="settings" className="pt-6">
          <ClubSettings club={club} canDelete={access.role === "admin"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
