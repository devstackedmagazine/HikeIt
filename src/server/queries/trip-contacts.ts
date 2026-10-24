import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  organizationMembers,
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";
import {
  CONTACT_VISIBLE_STATUSES,
  contactAccess,
  type ContactAccessDenial,
  contactWindow,
} from "@/lib/trips/contact-access";

export interface ParticipantContact {
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export type TripContacts =
  | {
      available: true;
      closesAt: Date;
      /** Keyed by registration id; approved registrations only. */
      contacts: Record<string, ParticipantContact>;
    }
  | {
      available: false;
      reason: ContactAccessDenial | "not-found";
      opensAt: Date | null;
    };

/**
 * Phone and emergency contact of a trip's participants, for that club's
 * organisers. Every condition is checked here, from the database, not taken
 * from the caller: the viewer's current role in the club that owns the trip,
 * the trip's status and the time window (`contactAccess`), and — per row —
 * that the registration is approved (confirmed, attended or no-show).
 * Nothing here is logged.
 */
export async function getTripContactsForOrganiser(
  tripId: string,
  viewerUserId: string,
  now: Date = new Date(),
): Promise<TripContacts> {
  const [trip] = await db
    .select({
      id: trips.id,
      organizationId: trips.organizationId,
      status: trips.status,
      startDatetime: trips.startDatetime,
      endDatetime: trips.endDatetime,
    })
    .from(trips)
    .where(and(eq(trips.id, tripId), isNull(trips.deletedAt)))
    .limit(1);
  if (!trip) return { available: false, reason: "not-found", opensAt: null };

  const [membership] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, trip.organizationId),
        eq(organizationMembers.userId, viewerUserId),
        isNull(organizationMembers.leftAt),
      ),
    )
    .limit(1);

  const access = contactAccess({
    viewerRole: membership?.role ?? null,
    trip,
    now,
  });
  const { opensAt, closesAt } = contactWindow(trip);
  if (!access.allowed) {
    return {
      available: false,
      reason: access.reason,
      opensAt: access.reason === "before-window" ? opensAt : null,
    };
  }

  const rows = await db
    .select({
      registrationId: tripRegistrations.id,
      phone: users.phone,
      emergencyContactName: users.emergencyContactName,
      emergencyContactPhone: users.emergencyContactPhone,
    })
    .from(tripRegistrations)
    .innerJoin(users, eq(users.id, tripRegistrations.userId))
    .where(
      and(
        eq(tripRegistrations.tripId, trip.id),
        inArray(tripRegistrations.status, [...CONTACT_VISIBLE_STATUSES]),
      ),
    );

  const contacts: Record<string, ParticipantContact> = {};
  for (const { registrationId, ...contact } of rows) {
    contacts[registrationId] = contact;
  }
  return { available: true, closesAt, contacts };
}
