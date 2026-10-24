/**
 * Server-side, lossless removal of photo metadata (EXIF — including GPS —
 * XMP, IPTC, comments) before an image leaves our server for Cloudinary.
 *
 * Pixels are never re-encoded: only metadata segments/chunks are dropped, so
 * the photo looks exactly the same. The one piece of metadata that changes
 * how a photo is displayed — the EXIF orientation tag — is carried over in a
 * minimal replacement EXIF block that contains nothing else.
 *
 * JPEG, PNG and WebP are handled here. HEIC/HEIF is not: it's converted to
 * JPEG by Cloudinary on upload (see `uploadImage`). An input this module
 * can't parse is returned unchanged.
 */

/** Minimal big-endian TIFF block holding only IFD0 Orientation (0x0112). */
function orientationTiff(orientation: number): Buffer {
  const tiff = Buffer.alloc(26);
  tiff.write("MM", 0, "ascii");
  tiff.writeUInt16BE(0x002a, 2);
  tiff.writeUInt32BE(8, 4); // IFD0 offset
  tiff.writeUInt16BE(1, 8); // one entry
  tiff.writeUInt16BE(0x0112, 10); // Orientation
  tiff.writeUInt16BE(3, 12); // SHORT
  tiff.writeUInt32BE(1, 14); // count
  tiff.writeUInt16BE(orientation, 18); // value (left-justified)
  tiff.writeUInt32BE(0, 22); // no next IFD
  return tiff;
}

/** Orientation (2–8) from a TIFF block, or null when absent / the default. */
function readOrientation(tiff: Buffer): number | null {
  if (tiff.length < 8) return null;
  const order = tiff.toString("ascii", 0, 2);
  if (order !== "II" && order !== "MM") return null;
  const le = order === "II";
  const u16 = (o: number) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o: number) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return null;
  const count = u16(ifd);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > tiff.length) return null;
    if (u16(entry) === 0x0112) {
      const value = u16(entry + 8);
      return value >= 2 && value <= 8 ? value : null;
    }
  }
  return null;
}

const EXIF_HEADER = Buffer.from("Exif\0\0", "ascii");

function stripJpeg(input: Buffer): Buffer {
  const parts: Buffer[] = [input.subarray(0, 2)];
  let orientation: number | null = null;
  let insertAt = 1; // index in `parts` after which the EXIF block goes
  let offset = 2;

  while (offset + 4 <= input.length) {
    if (input[offset] !== 0xff) return input; // not where a marker should be
    const marker = input[offset + 1]!;
    if (marker === 0xff) {
      offset++; // fill byte
      continue;
    }
    // Start of scan: everything from here on is image data — copy verbatim.
    if (marker === 0xda) break;
    // Standalone markers carry no length.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(input.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }
    const length = input.readUInt16BE(offset + 2);
    const end = offset + 2 + length;
    if (length < 2 || end > input.length) return input;
    const segment = input.subarray(offset, end);
    const payload = input.subarray(offset + 4, end);

    const isApp = marker >= 0xe0 && marker <= 0xef;
    let keep = true;
    if (marker === 0xfe)
      keep = false; // COM
    else if (isApp) {
      if (marker === 0xe0)
        keep = true; // JFIF
      else if (marker === 0xe2) {
        keep = payload.toString("ascii", 0, 12) === "ICC_PROFILE\0"; // colour
      } else if (marker === 0xee)
        keep = true; // Adobe (colour transform)
      else keep = false; // APP1 (EXIF/XMP), APP13 (IPTC) and the rest
      if (marker === 0xe1 && payload.subarray(0, 6).equals(EXIF_HEADER)) {
        orientation ??= readOrientation(payload.subarray(6));
      }
    }
    if (keep) {
      parts.push(segment);
      if (marker === 0xe0) insertAt = parts.length;
    }
    offset = end;
  }

  if (orientation !== null) {
    const body = Buffer.concat([EXIF_HEADER, orientationTiff(orientation)]);
    const header = Buffer.from([0xff, 0xe1, 0, 0]);
    header.writeUInt16BE(body.length + 2, 2);
    parts.splice(insertAt, 0, header, body);
  }
  parts.push(input.subarray(offset));
  return Buffer.concat(parts);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/** PNG text and EXIF chunks; everything else (incl. iCCP colour) is kept. */
const PNG_DROP = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);

function stripPng(input: Buffer): Buffer {
  const parts: Buffer[] = [input.subarray(0, 8)];
  let offset = 8;
  while (offset + 12 <= input.length) {
    const length = input.readUInt32BE(offset);
    const type = input.toString("ascii", offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > input.length) return input;
    if (PNG_DROP.has(type)) {
      if (type === "eXIf") {
        const orientation = readOrientation(
          input.subarray(offset + 8, offset + 8 + length),
        );
        if (orientation !== null) {
          parts.push(pngChunk("eXIf", orientationTiff(orientation)));
        }
      }
    } else {
      parts.push(input.subarray(offset, end));
    }
    offset = end;
    if (type === "IEND") break;
  }
  return Buffer.concat(parts);
}

function stripWebp(input: Buffer): Buffer {
  const chunks: Buffer[] = [];
  let vp8xIndex = -1;
  let hasExif = false;
  let offset = 12;
  while (offset + 8 <= input.length) {
    const type = input.toString("ascii", offset, offset + 4);
    const size = input.readUInt32LE(offset + 4);
    const end = offset + 8 + size + (size % 2);
    if (offset + 8 + size > input.length) return input;
    if (type === "EXIF") {
      let tiff = input.subarray(offset + 8, offset + 8 + size);
      if (tiff.subarray(0, 6).equals(EXIF_HEADER)) tiff = tiff.subarray(6);
      const orientation = readOrientation(tiff);
      if (orientation !== null) {
        const data = orientationTiff(orientation);
        const head = Buffer.alloc(8);
        head.write("EXIF", 0, "ascii");
        head.writeUInt32LE(data.length, 4);
        chunks.push(Buffer.concat([head, data]));
        hasExif = true;
      }
    } else if (type !== "XMP ") {
      if (type === "VP8X") vp8xIndex = chunks.length;
      chunks.push(
        Buffer.from(input.subarray(offset, Math.min(end, input.length))),
      );
    }
    offset = end;
  }
  if (vp8xIndex >= 0) {
    const vp8x = chunks[vp8xIndex]!;
    // VP8X flags: 0x08 = EXIF present, 0x04 = XMP present.
    vp8x[8] = (vp8x[8]! & ~0x0c) | (hasExif ? 0x08 : 0);
  }
  // A simple-format WebP (no VP8X) can't declare EXIF at all, so it gets none.
  const body = Buffer.concat(
    vp8xIndex >= 0
      ? chunks
      : chunks.filter((c) => c.toString("ascii", 0, 4) !== "EXIF"),
  );
  const header = Buffer.from(input.subarray(0, 12));
  header.writeUInt32LE(body.length + 4, 4);
  return Buffer.concat([header, body]);
}

/** Remove metadata from a JPEG, PNG or WebP buffer; other input is returned as-is. */
export function stripImageMetadata(input: Buffer): Buffer {
  try {
    if (input.length > 3 && input[0] === 0xff && input[1] === 0xd8) {
      return stripJpeg(input);
    }
    if (
      input.length > 8 &&
      input
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return stripPng(input);
    }
    if (
      input.length > 12 &&
      input.toString("ascii", 0, 4) === "RIFF" &&
      input.toString("ascii", 8, 12) === "WEBP"
    ) {
      return stripWebp(input);
    }
  } catch {
    // Malformed structure: leave it to the downstream validator.
  }
  return input;
}
