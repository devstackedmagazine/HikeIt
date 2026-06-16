import { ArrowLeft, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Placeholder for public sections that ship in a later session. */
export function ComingSoon({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>
      <p className="mt-1 text-sm font-medium text-accent">Së shpejti</p>
      <Button variant="outline" className="mt-8" render={<Link href="/" />}>
        <ArrowLeft />
        Kthehu në ballinë
      </Button>
    </div>
  );
}
