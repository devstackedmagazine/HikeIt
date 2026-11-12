import { ImageResponse } from "next/og";

import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  ogTemplate,
} from "@/lib/og/og-template";
import { formatTripDate } from "@/lib/utils/datetime";
import { getTripById } from "@/server/queries/trips";

export const alt = "Udhëtim në HikeIt";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const found = await getTripById(tripId);
  // Same rule as the page: a draft or deleted trip shows nothing.
  const trip =
    found && found.status !== "draft" && found.deletedAt === null
      ? found
      : null;
  const subtitle = trip
    ? `${trip.club.name} · ${formatTripDate(trip.startDatetime)}`
    : undefined;
  return new ImageResponse(
    ogTemplate({
      title: trip?.title ?? "Udhëtim",
      subtitle,
      eyebrow: "Udhëtim · HikeIt",
    }),
    { ...size },
  );
}
