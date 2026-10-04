import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ClubMembersTable } from "@/components/features/clubs/club-members-table";
import { ClubSettings } from "@/components/features/clubs/club-settings";
import { ClubTripsTable } from "@/components/features/clubs/club-trips-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRequiredUser, requireClubAdmin } from "@/lib/auth/helpers";
import { getClubMembers } from "@/server/queries/clubs";
import { getClubTrips } from "@/server/queries/trips";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Paneli — ${slug}` };
}

/**
 * The club's overview lives at /dashboard (the page club admins land on), so
 * this page only hosts the remaining tabs. A bare URL or the old
 * `?tab=overview` redirects home rather than rendering a second overview.
 */
const TABS = ["trips", "members", "settings"] as const;

export default async function ClubAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab: tabParam } = await searchParams;
  const user = await getRequiredUser();
  const access = await requireClubAdmin(user.id, slug);
  // Access first: an unknown slug or a non-admin still gets a 404, not a
  // redirect that confirms the club exists.
  if (!access) notFound();

  const tab = TABS.find((t) => t === tabParam);
  if (!tab) redirect("/dashboard");

  const club = access.organization;
  const [tripsResult, membersResult] = await Promise.all([
    getClubTrips(club.id, { limit: 50 }),
    getClubMembers(club.id, { limit: 100 }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
        <p className="text-muted-foreground">{club.city}</p>
      </div>

      <Tabs key={tab} defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="trips">Udhëtimet</TabsTrigger>
          <TabsTrigger value="members">Anëtarët</TabsTrigger>
          <TabsTrigger value="settings">Cilësimet</TabsTrigger>
        </TabsList>

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
