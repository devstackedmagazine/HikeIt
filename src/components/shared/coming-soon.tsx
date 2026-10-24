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
      <div className="bg-primary/10 text-primary mb-6 flex size-16 items-center justify-center rounded-2xl">
        <Icon className="size-8" />
      </div>
      <h1 className="font-heading text-3xl font-black uppercase sm:text-4xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-3 text-lg">{subtitle}</p>
      <p className="text-accent mt-1 text-sm font-medium">Së shpejti</p>
      <Button variant="outline" className="mt-8" render={<Link href="/" />}>
        <ArrowLeft />
        Kthehu në ballinë
      </Button>
    </div>
  );
}
