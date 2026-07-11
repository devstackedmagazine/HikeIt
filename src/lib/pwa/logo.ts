import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Base64 data URI for the HikeIt mountain mark. Read once from disk so
 * `ImageResponse`-based routes (favicons, app icons, OG images) can embed it
 * without a network fetch — `next/og`'s Satori renderer accepts `<img src>`
 * as either a URL or a data URI.
 */
export const LOGO_DATA_URI = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/logos/Hikeit-pfp.png"),
).toString("base64")}`;
