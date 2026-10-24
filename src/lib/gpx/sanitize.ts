import { parseStringPromise } from "xml2js";

import { GpxError, sanitizeXml } from "@/lib/gpx/parser";

/**
 * Rebuild a GPX document for public storage, keeping only geometry.
 *
 * Trail and trip GPX files are published for anyone to download, so the
 * stored copy is not the file the user uploaded: every `<time>`,
 * `<extensions>` (heart rate, cadence, device data), the whole `<metadata>`
 * block (author, device, name, link), the `creator` attribute (usually the
 * device or app) and every name/description/comment is dropped. What remains
 * is each track and route point's `lat`/`lon` and `<ele>`, plus waypoints
 * (position, elevation, name). Coordinate and elevation text is copied
 * verbatim, so `parseGpxString` returns the same distance, elevation and
 * map line for the sanitized file as for the original.
 *
 * `name`, when given, becomes the track name (the published trail/trip
 * title, so GPS apps show something meaningful).
 */
export async function sanitizeGpx(
  gpxContent: string,
  name?: string,
): Promise<string> {
  let parsed: Record<string, unknown>;
  try {
    parsed = await parseStringPromise(sanitizeXml(gpxContent));
  } catch (error) {
    if (error instanceof GpxError) throw error;
    throw new GpxError("Skedari GPX nuk është i vlefshëm.");
  }
  const gpx = (parsed as { gpx?: Record<string, unknown> }).gpx;
  if (!gpx) throw new GpxError("Mungon elementi <gpx>.");

  const out: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="HikeIt" xmlns="http://www.topografix.com/GPX/1/1">',
  ];

  for (const wpt of asArray(gpx.wpt)) {
    const point = pointXml("wpt", wpt);
    if (!point) continue;
    const wptName = text(wpt.name);
    out.push(
      wptName
        ? point.replace("</wpt>", `<name>${escapeXml(wptName)}</name></wpt>`)
        : point,
    );
  }

  for (const rte of asArray(gpx.rte)) {
    const points = asArray(rte.rtept)
      .map((p) => pointXml("rtept", p))
      .filter(Boolean);
    if (points.length > 0) out.push(`<rte>${points.join("")}</rte>`);
  }

  for (const [i, trk] of asArray(gpx.trk).entries()) {
    const segments = asArray(trk.trkseg)
      .map((seg) => {
        const points = asArray(seg.trkpt)
          .map((p) => pointXml("trkpt", p))
          .filter(Boolean);
        return `<trkseg>${points.join("")}</trkseg>`;
      })
      .join("");
    const trkName = i === 0 && name ? `<name>${escapeXml(name)}</name>` : "";
    out.push(`<trk>${trkName}${segments}</trk>`);
  }

  out.push("</gpx>");
  return out.join("\n");
}

type XmlNode = Record<string, unknown>;

function asArray(value: unknown): XmlNode[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is XmlNode => typeof v === "object" && v !== null);
}

/** First text child of an element, ignoring elements that carry attributes. */
function text(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : undefined;
  return typeof first === "string" && first.trim() !== "" ? first : undefined;
}

/**
 * `<tag lat lon><ele/></tag>`, or null for a point the parser would skip.
 * `<ele>` is kept under the same condition the parser reads it, so the
 * sanitized file parses to identical numbers.
 */
function pointXml(tag: string, node: XmlNode): string | null {
  const attrs = node.$ as { lat?: string; lon?: string } | undefined;
  const lat = attrs?.lat;
  const lon = attrs?.lon;
  if (lat === undefined || lon === undefined) return null;
  if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) return null;
  const ele = Array.isArray(node.ele) ? node.ele[0] : undefined;
  const eleXml =
    typeof ele === "string" && ele !== "" ? `<ele>${escapeXml(ele)}</ele>` : "";
  return `<${tag} lat="${escapeXml(lat)}" lon="${escapeXml(lon)}">${eleXml}</${tag}>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
