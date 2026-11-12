import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TripCoverField } from "@/components/features/trips/trip-cover-field";
import { TripForm } from "@/components/features/trips/trip-form";
import { TripGpxSection } from "@/components/features/trips/trip-gpx-section";
import { getRequiredUser, requireClubAdmin } from "@/lib/auth/helpers";
import { getTrailOptions } from "@/server/queries/trails";
import { getTripById } from "@/server/queries/trips";

export const metadata: Metadata = { title: "Ndryshoni Udhëtimin" };

/** Convert a Date to the `YYYY-MM-DDTHH:mm` value a datetime-local input wants. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditTripPage({
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

  const trailOptions = await getTrailOptions();

  return (
    <div className="bg-abyss -mx-6 -my-5 min-h-svh px-6 py-5 pb-24 md:pb-12">
      <div className="max-w-[640px] space-y-6">
        <nav className="text-summit/40 flex items-center gap-1 text-xs">
          <Link href="/dashboard" className="hover:text-summit">
            {access.organization.name}
          </Link>
          <ChevronRight className="size-3.5" />
          <Link
            href={`/dashboard/club/${slug}/trips/${trip.slug}`}
            className="hover:text-summit"
          >
            {trip.title}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-summit/70">Ndryshoni</span>
        </nav>

        <h1 className="font-heading text-summit text-2xl font-extrabold tracking-tight uppercase">
          Ndryshoni Udhëtimin
        </h1>

        <TripForm
          mode="edit"
          clubSlug={slug}
          tripId={trip.id}
          tripSlug={trip.slug}
          trailOptions={trailOptions}
          initialValues={{
            title: trip.title,
            description: trip.description ?? "",
            trailId: trip.trailId ?? "",
            difficulty: trip.difficulty ?? undefined,
            startDatetime: toLocalInput(trip.startDatetime),
            endDatetime: trip.endDatetime ? toLocalInput(trip.endDatetime) : "",
            meetingPoint: trip.meetingPoint ?? "",
            maxParticipants: trip.maxParticipants ?? undefined,
            minParticipants: trip.minParticipants,
            requirements: trip.requirements ?? "",
            included: trip.included ?? "",
            priceEur: Number(trip.priceEur),
            publish: trip.status === "open",
          }}
        />

        <TripCoverField tripId={trip.id} initialPublicId={trip.coverImageUrl} />

        <TripGpxSection tripId={trip.id} existingGpxUrl={trip.gpxUrl} />
      </div>
    </div>
  );
}
