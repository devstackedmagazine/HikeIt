import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

/** HikeIt wordmark with the logo mark. Links home unless `asLink={false}`. */
export function Brand({
  className,
  asLink = true,
}: {
  className?: string;
  asLink?: boolean;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-heading text-xl font-extrabold uppercase tracking-tight",
        className,
      )}
    >
      <Image
        src="/logos/Hikeit-pfp.png"
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0"
      />
      <span>HIKEIT</span>
    </span>
  );

  if (!asLink) return content;
  return <Link href="/">{content}</Link>;
}
