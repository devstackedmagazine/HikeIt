import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { hikes, tripRegistrations, trips } from "@/lib/db/schema";
import { countedRegistrationWhere } from "@/server/queries/personal-stats";

export interface HikeListItem {
  id: string;
  name: string;
  hikedAt: Date;
  distanceKm: number;
  elevationGainM: number;
  durationMin: number;
  track: [number, number][];
  tripTitle: string | null;
}

/**
 * The owner's hikes, newest first. Always scoped by `userId` — hikes are
 * private, so there is deliberately no query that reads another user's.
 */
export async function getUserHikes(userId: string): Promise<HikeListItem[]> {
  const rows = await db
    .select({
      id: hikes.id,
      name: hikes.name,
      hikedAt: hikes.hikedAt,
      distanceKm: hikes.distanceKm,
      elevationGainM: hikes.elevationGainM,
      durationMin: hikes.durationMin,
      track: hikes.gpxTrack,
      tripTitle: trips.title,
    })
    .from(hikes)
    .leftJoin(
      tripRegistrations,
      eq(tripRegistrations.id, hikes.tripRegistrationId),
    )
    .leftJoin(trips, eq(trips.id, tripRegistrations.tripId))
    .where(eq(hikes.userId, userId))
    .orderBy(desc(hikes.hikedAt));

  return rows.map((r) => ({ ...r, distanceKm: Number(r.distanceKm) }));
}

export interface LinkableTrip {
  registrationId: string;
  title: string;
  startDatetime: Date;
}

/**
 * Completed trips the user was on that no hike claims yet — the options
 * for "this hike was that club trip".
 */
export async function getLinkableTrips(userId: string): Promise<LinkableTrip[]> {
  return db
    .select({
      registrationId: tripRegistrations.id,
      title: trips.title,
      startDatetime: trips.startDatetime,
    })
    .from(tripRegistrations)
    .innerJoin(trips, eq(trips.id, tripRegistrations.tripId))
    // Exactly the registrations that currently count via trail distance —
    // linking a hike moves the trip from that side to the hike side.
    .where(countedRegistrationWhere(userId))
    .orderBy(desc(trips.startDatetime))
    .limit(50);
}
