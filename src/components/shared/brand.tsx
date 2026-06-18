import { Mountain } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

/** HikeIt wordmark with the mountain glyph. Links home unless `asLink={false}`. */
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
      <span className="flex size-7 items-center justify-center bg-forest text-summit">
        <Mountain className="size-4" />
      </span>
      <span>HIKEIT</span>
    </span>
  );

  if (!asLink) return content;
  return <Link href="/">{content}</Link>;
}
