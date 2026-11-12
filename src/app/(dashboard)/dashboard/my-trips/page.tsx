import type { Metadata } from "next";

import { MyTripsView } from "@/components/features/trips/my-trips-view";
import { getRequiredUser } from "@/lib/auth/helpers";
import { getUserFavoriteTrips } from "@/server/queries/favorites";
import { getUserRegistrations } from "@/server/queries/trips";

export const metadata: Metadata = { title: "Udhëtimet e mia" };

export default async function MyTripsPage() {
  const user = await getRequiredUser();
  const [upcoming, past, waitlisted, saved] = await Promise.all([
    getUserRegistrations(user.id, "upcoming"),
    getUserRegistrations(user.id, "past"),
    getUserRegistrations(user.id, "waitlisted"),
    getUserFavoriteTrips(user.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="font-heading text-2xl font-black uppercase">
        Udhëtimet e mia
      </h1>
      <MyTripsView
        upcoming={upcoming}
        past={past}
        waitlisted={waitlisted}
        saved={saved}
      />
    </div>
  );
}
