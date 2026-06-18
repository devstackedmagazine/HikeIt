import { Calendar, Map, Mountain, User, Users } from "lucide-react";
import Image from "next/image";

import { getImageUrl, type ImageSize } from "@/lib/cloudinary/urls";
import { cn } from "@/lib/utils/cn";

const FALLBACK_ICON = {
  trail: Map,
  club: Users,
  trip: Mountain,
  avatar: User,
  calendar: Calendar,
} as const;

export interface CloudImageProps {
  publicId: string | null | undefined;
  size: Exclude<ImageSize, "original">;
  alt: string;
  className?: string;
  fallback?: keyof typeof FALLBACK_ICON;
  priority?: boolean;
  sizes?: string;
}

/**
 * Optimized Cloudinary image keyed by `publicId`. Falls back to a branded
 * gradient + icon when there's no image (or Cloudinary isn't configured).
 */
export function CloudImage({
  publicId,
  size,
  alt,
  className,
  fallback = "trip",
  priority,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: CloudImageProps) {
  const url = publicId ? getImageUrl(publicId, size) : "";
  const Icon = FALLBACK_ICON[fallback];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-primary to-emerald-950",
        className,
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon className="size-10 text-primary-foreground/40" />
        </div>
      )}
    </div>
  );
}
