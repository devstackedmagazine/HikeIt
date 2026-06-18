"use server";

import { and, count, eq, gte, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { env } from "@/config/env";
import { getOptionalSession, requireClubAdmin } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  auditLogs,
  organizationMembers,
  organizations,
  trails,
  tripRegistrations,
  trips,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { NewTripNotification } from "@/lib/email/templates/new-trip-notification";
import {
  type TripChange,
  TripUpdated,
} from "@/lib/email/templates/trip-updated";
import { formatTripDateTime } from "@/lib/utils/datetime";
import { generateSlug } from "@/lib/utils/slug";
import { type CreateTripInput,createTripSchema } from "@/lib/validations/trips";

export interface CreateTripResult {
  success: boolean;
  tripId?: string;
  slug?: string;
  error?: string;
  upgradeRequired?: boolean;
}

export async function createTrip(
  clubSlug: string,
  data: CreateTripInput,
): Promise<CreateTripResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const access = await requireClubAdmin(session.user.id, clubSlug);
  if (!access) return { success: false, error: "Nuk keni qasje." };

  // Free tier: cap at 3 trips per calendar month.
  if (access.organization.subscriptionTier === "free") {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [tripCount] = await db
      .select({ value: count() })
      .from(trips)
      .where(
        and(
          eq(trips.organizationId, access.organization.id),
          gte(trips.createdAt, monthStart),
          ne(trips.status, "canceled"),
        ),
      );
    if ((tripCount?.value ?? 0) >= 3) {
      return {
        success: false,
        error:
          "Keni arritur limitin e 3 udhëtimeve në muaj. Kaloni te Pro për udhëtime të pakufizuara.",
        upgradeRequired: true,
      };
    }
  }

  const parsed = createTripSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Të dhëna të pavlefshme." };
  }
  const input = parsed.data;

  // Resolve difficulty from the trail if not provided directly.
  let difficulty = input.difficulty ?? null;
  const trailId = input.trailId || null;
  if (trailId && !difficulty) {
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
      columns: { difficulty: true },
    });
    difficulty = trail?.difficulty ?? null;
  }

  const slug = `${generateSlug(input.title)}-${crypto.randomUUID().slice(0, 6)}`;
  const status = input.publish ? "open" : "draft";

  const [trip] = await db
    .insert(trips)
    .values({
      slug,
      organizationId: access.organization.id,
      trailId,
      title: input.title,
      description: input.description || null,
      startDatetime: new Date(input.startDatetime),
      endDatetime: input.endDatetime ? new Date(input.endDatetime) : null,
      meetingPoint: input.meetingPoint || null,
      meetingLat: input.meetingLat ? String(input.meetingLat) : null,
      meetingLng: input.meetingLng ? String(input.meetingLng) : null,
      maxParticipants: input.maxParticipants ?? null,
      minParticipants: input.minParticipants,
      requirements: input.requirements || null,
      included: input.included || null,
      priceEur: String(input.priceEur),
      difficulty,
      status,
      createdBy: session.user.id,
    })
    .returning({ id: trips.id, slug: trips.slug });

  if (!trip) return { success: false, error: "Diçka shkoi keq." };

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "trip.created",
    entityType: "trip",
    entityId: trip.id,
    metadata: { organizationId: access.organization.id },
  });

  // Notify club members when the trip is published immediately.
  if (status === "open") {
    void notifyMembers(access.organization.id, access.organization.name, {
      tripTitle: input.title,
      slug: trip.slug,
      startDatetime: new Date(input.startDatetime),
    });
  }

  revalidatePath(`/dashboard/club/${clubSlug}`);
  return { success: true, tripId: trip.id, slug: trip.slug };
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** Admin: publish a draft trip (sets status open + notifies members). */
export async function publishTrip(
  clubSlug: string,
  tripId: string,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const access = await requireClubAdmin(session.user.id, clubSlug);
  if (!access) return { success: false, error: "Nuk keni qasje." };

  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip || trip.organizationId !== access.organization.id) {
    return { success: false, error: "Udhëtimi nuk u gjet." };
  }
  if (trip.status !== "draft") {
    return { success: false, error: "Vetëm draftet mund të publikohen." };
  }

  await db.update(trips).set({ status: "open" }).where(eq(trips.id, tripId));

  void notifyMembers(access.organization.id, access.organization.name, {
    tripTitle: trip.title,
    slug: trip.slug,
    startDatetime: trip.startDatetime,
  });

  revalidatePath(`/dashboard/club/${clubSlug}`);
  revalidatePath(`/dashboard/club/${clubSlug}/trips/${trip.slug}`);
  return { success: true };
}

export async function updateTrip(
  tripId: string,
  data: CreateTripInput,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) return { success: false, error: "Udhëtimi nuk u gjet." };

  const club = await db.query.organizations.findFirst({
    where: eq(organizations.id, trip.organizationId),
    columns: { slug: true },
  });
  if (!club) return { success: false, error: "Klubi nuk u gjet." };

  const access = await requireClubAdmin(session.user.id, club.slug);
  if (!access || access.organization.id !== trip.organizationId) {
    return { success: false, error: "Nuk keni qasje." };
  }
  const clubSlug = club.slug;

  const parsed = createTripSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Të dhëna të pavlefshme." };
  }
  const input = parsed.data;

  const newStart = new Date(input.startDatetime);
  if (newStart.getTime() < Date.now()) {
    return { success: false, error: "Data e nisjes nuk mund të jetë në të kaluarën." };
  }

  // Registration-based locks.
  const [confirmed] = await db
    .select({ value: count() })
    .from(tripRegistrations)
    .where(
      and(
        eq(tripRegistrations.tripId, tripId),
        eq(tripRegistrations.status, "confirmed"),
      ),
    );
  const confirmedCount = confirmed?.value ?? 0;

  if (
    input.maxParticipants != null &&
    input.maxParticipants < confirmedCount
  ) {
    return {
      success: false,
      error: `Nuk mund të ulni max nën regjistrimet aktuale (${confirmedCount}).`,
    };
  }

  const newPrice = String(input.priceEur);
  if (newPrice !== trip.priceEur) {
    const [paid] = await db
      .select({ value: count() })
      .from(tripRegistrations)
      .where(
        and(
          eq(tripRegistrations.tripId, tripId),
          eq(tripRegistrations.paymentStatus, "paid"),
        ),
      );
    if ((paid?.value ?? 0) > 0) {
      return {
        success: false,
        error: "Nuk mund të ndryshoni çmimin pas pagesave të kryera.",
      };
    }
  }

  // Diff the important, user-facing fields for the change email + audit log.
  const changes: TripChange[] = [];
  if (trip.startDatetime.getTime() !== newStart.getTime()) {
    changes.push({
      label: "Data dhe ora",
      from: formatTripDateTime(trip.startDatetime),
      to: formatTripDateTime(newStart),
    });
  }
  const newMeeting = input.meetingPoint || null;
  if ((trip.meetingPoint ?? null) !== newMeeting) {
    changes.push({
      label: "Pika e takimit",
      from: trip.meetingPoint ?? "—",
      to: newMeeting ?? "—",
    });
  }

  await db
    .update(trips)
    .set({
      title: input.title,
      description: input.description || null,
      trailId: input.trailId || null,
      startDatetime: newStart,
      endDatetime: input.endDatetime ? new Date(input.endDatetime) : null,
      meetingPoint: newMeeting,
      maxParticipants: input.maxParticipants ?? null,
      minParticipants: input.minParticipants,
      requirements: input.requirements || null,
      included: input.included || null,
      priceEur: newPrice,
      difficulty: input.difficulty ?? trip.difficulty,
    })
    .where(eq(trips.id, tripId));

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "trip.updated",
    entityType: "trip",
    entityId: tripId,
    metadata: {
      organizationId: trip.organizationId,
      changes: changes.map((c) => c.label),
    },
  });

  // Notify confirmed registrants when date/time or meeting point changed.
  if (changes.length > 0) {
    void notifyRegistrantsOfUpdate(tripId, trip.title, trip.slug, changes);
  }

  revalidatePath(`/dashboard/club/${clubSlug}/trips/${trip.slug}`);
  revalidatePath(`/trips/${trip.slug}`);
  return { success: true };
}

async function notifyRegistrantsOfUpdate(
  tripId: string,
  tripTitle: string,
  tripSlug: string,
  changes: TripChange[],
): Promise<void> {
  try {
    const recipients = await db
      .select({ email: users.email })
      .from(tripRegistrations)
      .innerJoin(users, eq(users.id, tripRegistrations.userId))
      .where(
        and(
          eq(tripRegistrations.tripId, tripId),
          eq(tripRegistrations.status, "confirmed"),
        ),
      );
    const tripUrl = `${env.NEXT_PUBLIC_APP_URL}/trips/${tripSlug}`;
    await Promise.allSettled(
      recipients.map((r) =>
        sendEmail({
          to: r.email,
          subject: `Ndryshime: ${tripTitle}`,
          template: TripUpdated({ tripName: tripTitle, changes, tripUrl }),
        }),
      ),
    );
  } catch {
    // best-effort
  }
}

async function notifyMembers(
  organizationId: string,
  clubName: string,
  trip: { tripTitle: string; slug: string; startDatetime: Date },
): Promise<void> {
  try {
    const members = await db
      .select({ email: users.email })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          isNull(organizationMembers.leftAt),
        ),
      );

    const tripUrl = `${env.NEXT_PUBLIC_APP_URL}/trips/${trip.slug}`;
    const dateLabel = formatTripDateTime(trip.startDatetime);

    await Promise.allSettled(
      members.map((m) =>
        sendEmail({
          to: m.email,
          subject: `Udhëtim i ri: ${trip.tripTitle}`,
          template: NewTripNotification({
            clubName,
            tripTitle: trip.tripTitle,
            dateLabel,
            tripUrl,
          }),
        }),
      ),
    );
  } catch {
    // Best-effort — never block trip creation on email delivery.
  }
}
