/**
 * Browser-only: shrink an image before upload so it fits the request body
 * limits (Next server actions, and Vercel's 4.5MB per-request ceiling, which
 * no app setting can raise). A phone photo of 3–8MB becomes a few hundred KB.
 *
 * This is a transport optimisation, not a security control — the server's
 * Cloudinary pipeline still validates whatever arrives. If the browser can't
 * decode the image (e.g. HEIC outside Safari), the original file is returned
 * unchanged and the server decides.
 */
export async function downscaleImage(
  file: File,
  maxDimension: number,
  quality = 0.88,
): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
