import { Star } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/** Read-only star display (rounds to nearest whole star). */
export function StarRating({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i <= rounded
              ? "fill-accent text-accent"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}
