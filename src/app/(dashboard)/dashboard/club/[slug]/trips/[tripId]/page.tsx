import { ExternalLink, ImagePlus, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TripAdminActions } from "@/components/features/trips/trip-admin-actions";
import { TripPhotosManager } from "@/components/features/trips/trip-photos-manager";
import { TripRegistrationsPanel } from "@/components/features/trips/trip-registrations-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRequiredUser, requireClubAdmin } from "@/lib/auth/helpers";
import { tripStatusLabels } from "@/lib/i18n/labels";
import { displayTripStatus } from "@/lib/trips/display-status";
import { formatTripDateTime } from "@/lib/utils/datetime";
import { getTripPhotos } from "@/server/queries/photos";
import { getTripContactsForOrganiser } from "@/server/queries/trip-contacts";
import { getTripById, getTripRegistrations } from "@/server/queries/trips";

export const metadata: Metadata = { title: "Udhëtimi" };

export default async function AdminTripDetailPage({
  params,
}: {
  params: Promise<{ slug: string; tripId: string }>;
}) {
  const { slug, tripId } = await params;
  const user = await getRequiredUser();
  const access = await requireClubAdmin(user.id, slug);
  if (!access) notFound();

  const trip = await getTripById(tripId);
  if (!trip || trip.club.id !== access.organization.id) notFound();

  const [registrations, photos, contacts] = await Promise.all([
    getTripRegistrations(trip.id),
    getTripPhotos(trip.id),
    // Re-checks role, status and time window itself; never trust the page.
    getTripContactsForOrganiser(trip.id, user.id),
  ]);
  const confirmed = registrations.filter((r) => r.status === "confirmed");
  const waitlisted = registrations.filter((r) => r.status === "waitlisted");
  const active = registrations.filter((r) => r.status !== "canceled");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-black uppercase">
            {trip.title}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Badge variant="secondary">
              {tripStatusLabels[displayTripStatus(trip)]}
            </Badge>
            {formatTripDateTime(trip.startDatetime)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            render={
              <Link href={`/dashboard/club/${slug}/trips/${trip.slug}/edit`} />
            }
          >
            <Pencil />
            Ndrysho
          </Button>
          {trip.status !== "draft" ? (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/trips/${trip.slug}`} target="_blank" />}
            >
              <ExternalLink />
              Faqja publike
            </Button>
          ) : null}
          <TripAdminActions
            clubSlug={slug}
            tripId={trip.id}
            status={trip.status}
          />
        </div>
      </div>

      {trip.status === "draft" ? (
        <p className="border-alert/40 bg-alert/10 border-2 px-3 py-2 text-sm">
          Ky udhëtim është draft: nuk e sheh askush tjetër. Klikoni “Publiko”
          kur të jetë gati, që anëtarët të mund të regjistrohen.
        </p>
      ) : null}
      {!trip.coverImageUrl ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <ImagePlus className="size-4 shrink-0" />
          <span>
            Udhëtimi nuk ka ende foto kryesore.{" "}
            <Link
              href={`/dashboard/club/${slug}/trips/${trip.slug}/edit`}
              className="font-semibold underline underline-offset-4"
            >
              Shtoni një foto
            </Link>
          </span>
        </p>
      ) : null}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Përmbledhje</TabsTrigger>
          <TabsTrigger value="registrations">Regjistrimet</TabsTrigger>
          <TabsTrigger value="photos">Foto</TabsTrigger>
          <TabsTrigger value="settings">Cilësimet</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Regjistruar" value={active.length} />
            <Stat label="Konfirmuar" value={confirmed.length} />
            <Stat label="Në pritje" value={waitlisted.length} />
            <Stat
              label="Çmimi për person"
              value={Number(trip.priceEur) > 0 ? `€${trip.priceEur}` : "Falas"}
            />
          </div>

          {trip.meetingPoint ? (
            <Card>
              <CardContent className="py-4 text-sm">
                <p className="font-medium">Pika e takimit</p>
                <p className="text-muted-foreground">{trip.meetingPoint}</p>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="registrations" className="pt-6">
          <TripRegistrationsPanel
            tripId={trip.id}
            registrations={registrations}
            contacts={contacts}
          />
        </TabsContent>

        <TabsContent value="photos" className="pt-6">
          <TripPhotosManager
            tripId={trip.id}
            photos={photos.map((p) => ({
              id: p.id,
              publicId: p.cloudinaryPublicId,
            }))}
            manage
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 pt-6">
          <Button
            render={
              <Link href={`/dashboard/club/${slug}/trips/${trip.slug}/edit`} />
            }
          >
            <Pencil />
            Ndrysho Udhëtimin
          </Button>
          <p className="text-muted-foreground text-sm">
            Për të anuluar udhëtimin, përdorni butonin “Anulo udhëtimin” lart në faqe.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
