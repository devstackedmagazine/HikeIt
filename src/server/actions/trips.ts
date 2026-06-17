"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { env } from "@/config/env";
import { getOptionalSession, requireClubAdmin } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import {
  auditLogs,
  organizationMembers,
  trails,
  trips,
  users,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { NewTripNotification } from "@/lib/email/templates/new-trip-notification";
import { formatTripDateTime } from "@/lib/utils/datetime";
import { generateSlug } from "@/lib/utils/slug";
import { type CreateTripInput,createTripSchema } from "@/lib/validations/trips";

export interface CreateTripResult {
  success: boolean;
  tripId?: string;
  slug?: string;
  error?: string;
}

export async function createTrip(
  clubSlug: string,
  data: CreateTripInput,
): Promise<CreateTripResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const access = await requireClubAdmin(session.user.id, clubSlug);
  if (!access) return { success: false, error: "Nuk keni qasje." };

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
