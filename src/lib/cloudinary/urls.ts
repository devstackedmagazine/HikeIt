import { env } from "@/config/env";

export type ImageSize =
  | "thumbnail"
  | "medium"
  | "cover"
  | "avatar"
  | "gallery"
  | "original";

// Transformation string per size. `q_auto:good` + `f_auto` are always appended.
const SIZE_TRANSFORMS: Record<Exclude<ImageSize, "original">, string> = {
  thumbnail: "c_fill,w_400,h_300,g_auto",
  medium: "c_limit,w_800,h_600",
  cover: "c_fill,w_1200,h_630,g_auto",
  avatar: "c_fill,w_200,h_200,g_face",
  gallery: "c_limit,w_1200,h_900",
};

function base(): string | null {
  const cloud = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return null;
  return `https://res.cloudinary.com/${cloud}/image/upload`;
}

/** Optimized delivery URL for a stored `publicId`, or empty string if unset. */
export function getImageUrl(publicId: string, size: ImageSize): string {
  const root = base();
  if (!root) return "";
  if (size === "original") {
    return `${root}/q_auto:good,f_auto/${publicId}`;
  }
  return `${root}/${SIZE_TRANSFORMS[size]},q_auto:good,f_auto/${publicId}`;
}

/** Tiny blurred placeholder for progressive loading. */
export function getBlurUrl(publicId: string): string {
  const root = base();
  if (!root) return "";
  return `${root}/c_fill,w_20,h_20,e_blur:1000,q_1,f_auto/${publicId}`;
}
