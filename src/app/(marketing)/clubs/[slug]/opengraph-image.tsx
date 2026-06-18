import { ImageResponse } from "next/og";

import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  ogTemplate,
} from "@/lib/og/og-template";
import { getClubBySlug } from "@/server/queries/clubs";

export const alt = "Klub në HikeIt";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  return new ImageResponse(
    ogTemplate({
      title: club?.name ?? "Klub",
      subtitle: club?.city ?? undefined,
      eyebrow: "Klub · HikeIt",
    }),
    { ...size },
  );
}
