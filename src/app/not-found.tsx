import { Mountain } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-summit flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <div className="bg-primary/10 text-primary relative mb-6 flex size-20 items-center justify-center rounded-2xl">
        <Mountain className="size-10" />
        <span className="bg-sunset text-abyss absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full text-sm font-bold">
          ?
        </span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">
        404 — Faqja nuk u gjet
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Ndoshta shtegu që po kërkon ka humbur në mal...
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/" />}>Shko në Faqen Kryesore</Button>
        <Button variant="outline" render={<Link href="/trails" />}>
          Shfleto Shtigjet
        </Button>
      </div>
    </main>
  );
}
