import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ClubWithStats } from "@/server/queries/clubs";

export function ClubCard({ club }: { club: ClubWithStats }) {
  return (
    <Card className="flex flex-col overflow-hidden pt-0">
      {/* Cover + overlapping logo */}
      <div className="relative h-28 bg-gradient-to-br from-primary to-emerald-950">
        <div className="absolute -bottom-6 left-4 flex size-14 items-center justify-center rounded-full border-4 border-background bg-muted">
          <Users className="size-6 text-primary" />
        </div>
      </div>

      <CardContent className="flex-1 space-y-3 pt-8">
        <div>
          <h3 className="font-semibold leading-tight">{club.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {[club.city, club.foundedYear].filter(Boolean).join(" · ")}
          </p>
        </div>

        {club.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {club.description}
          </p>
        ) : null}

        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {club.memberCount} anëtarë
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {club.upcomingTripsCount} udhëtime
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          render={<Link href={`/clubs/${club.slug}`} />}
        >
          Shiko Klubin
          <ArrowRight />
        </Button>
      </CardFooter>
    </Card>
  );
}
