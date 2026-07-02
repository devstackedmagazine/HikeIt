import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TripForm } from "@/components/features/trips/trip-form";
import { getRequiredUser, requireClubAdmin } from "@/lib/auth/helpers";
import { getTrailOptions } from "@/server/queries/trails";

export const metadata: Metadata = { title: "Krijo Udhëtim" };

export default async function CreateTripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getRequiredUser();
  const access = await requireClubAdmin(user.id, slug);
  if (!access) notFound();

  const trailOptions = await getTrailOptions();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Krijo Udhëtim të Ri
        </h1>
        <p className="text-muted-foreground">{access.organization.name}</p>
      </div>
      <TripForm
        clubSlug={slug}
        trailOptions={trailOptions}
        canCollectPayments={
          access.organization.subscriptionTier === "pro" ||
          access.organization.subscriptionTier === "team"
        }
      />
    </div>
  );
}
