import { ImageResponse } from "next/og";

import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  ogTemplate,
} from "@/lib/og/og-template";

export const alt = "HikeIt — Komuniteti i Alpinizmit në Kosovë";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return new ImageResponse(
    ogTemplate({
      title: "Gjej shtigjet, gjej komunitetin tënd",
      subtitle: "Komuniteti i Alpinizmit në Kosovë",
    }),
    { ...size },
  );
}
