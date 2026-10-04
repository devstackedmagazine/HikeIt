import Image from "next/image";

import { cn } from "@/lib/utils/cn";

/**
 * Re-targets the size of a stored Cloudinary avatar URL
 * (`…/upload/c_fill,w_200,h_200,g_face,…/<id>`) so small chips don't download
 * the 200px version. Other hosts (e.g. a Google profile photo) pass through.
 */
export function avatarSrc(url: string, px: number): string {
  if (!url.includes("res.cloudinary.com")) return url;
  return url.replace(/w_\d+,h_\d+/, `w_${px},h_${px}`);
}

export function initialOf(name: string | null | undefined): string {
  return (name ?? "").trim().charAt(0).toUpperCase() || "?";
}

/**
 * The one place a user's picture is drawn: the stored image when there is
 * one, otherwise the name's initial. Always square. Size and colours come
 * from `className` (default: 32px Abyss chip with Moss ink, which is the only
 * Moss-on-dark pairing that clears AA).
 *
 * `px` is the Cloudinary delivery size — keep it ≈ 2× the rendered size.
 */
export function UserAvatar({
  name,
  src,
  px = 64,
  initials,
  className,
}: {
  name: string | null | undefined;
  src?: string | null;
  px?: number;
  /** Override the fallback text (e.g. two letters). */
  initials?: string;
  className?: string;
}) {
  const box = cn(
    "bg-abyss text-moss relative flex size-8 shrink-0 items-center justify-center overflow-hidden text-xs font-bold",
    className,
  );

  if (!src) {
    return (
      <span className={box} aria-hidden>
        {initials ?? initialOf(name)}
      </span>
    );
  }

  const isCloudinary = src.includes("res.cloudinary.com");
  return (
    <span className={box}>
      {isCloudinary ? (
        <Image
          src={avatarSrc(src, px)}
          alt={name ?? ""}
          width={px}
          height={px}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        // Provider photos (Google/Facebook) aren't in next/image's allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? ""}
          width={px}
          height={px}
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      )}
    </span>
  );
}
