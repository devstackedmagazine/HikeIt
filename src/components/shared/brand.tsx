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
        "inline-flex items-center gap-2 text-xl font-bold tracking-tight",
        className,
      )}
    >
      <Mountain className="size-6 text-primary" />
      <span>
        Hike<span className="text-primary">It</span>
      </span>
    </span>
  );

  if (!asLink) return content;
  return <Link href="/">{content}</Link>;
}
