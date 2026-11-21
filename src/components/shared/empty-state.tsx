import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "light",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  /** "dark" on Forest surfaces, where the default Abyss ink is unreadable. */
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center",
        dark && "border-summit/20",
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-14 items-center justify-center rounded-2xl",
          dark ? "bg-abyss text-sage" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-7" />
      </div>
      <h3 className={cn("text-lg font-semibold", dark && "text-summit")}>
        {title}
      </h3>
      {description ? (
        <p
          className={cn(
            "mt-1 max-w-sm text-sm",
            dark ? "text-summit/70" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? (
        <Button
          className={cn("mt-6", dark && "bg-moss text-abyss hover:bg-moss/90")}
          render={<Link href={action.href} />}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
