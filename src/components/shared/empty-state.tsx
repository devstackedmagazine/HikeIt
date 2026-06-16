import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-7" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button className="mt-6" render={<Link href={action.href} />}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
