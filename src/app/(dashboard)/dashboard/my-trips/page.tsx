import type { Metadata } from "next";

import { MyTripsView } from "@/components/features/trips/my-trips-view";
import { getRequiredUser } from "@/lib/auth/helpers";
import { getUserRegistrations } from "@/server/queries/trips";

export const metadata: Metadata = { title: "Udhëtimet e mia" };

export default async function MyTripsPage() {
  const user = await getRequiredUser();
  const [upcoming, past, waitlisted] = await Promise.all([
    getUserRegistrations(user.id, "upcoming"),
    getUserRegistrations(user.id, "past"),
    getUserRegistrations(user.id, "waitlisted"),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Udhëtimet e mia</h1>
      <MyTripsView upcoming={upcoming} past={past} waitlisted={waitlisted} />
    </div>
  );
}
