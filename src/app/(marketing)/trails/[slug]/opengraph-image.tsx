import { ImageResponse } from "next/og";

import { difficultyLabels } from "@/lib/i18n/labels";
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  ogTemplate,
} from "@/lib/og/og-template";
import { getTrailBySlug } from "@/server/queries/trails";

export const alt = "Shteg në HikeIt";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trail = await getTrailBySlug(slug);
  const subtitle = trail
    ? [trail.region, difficultyLabels[trail.difficulty]]
        .filter(Boolean)
        .join(" · ")
    : undefined;
  return new ImageResponse(
    ogTemplate({
      title: trail?.name ?? "Shteg",
      subtitle,
      eyebrow: "Shteg · HikeIt",
    }),
    { ...size },
  );
}
