import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import Link from "next/link";

import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatTripDate } from "@/lib/utils/datetime";
import type { TripWithClub } from "@/server/queries/trips";

function spotsTone(trip: TripWithClub): string {
  if (trip.maxParticipants === null) return "text-muted-foreground";
  const ratio = trip.confirmedCount / trip.maxParticipants;
  if (ratio >= 1) return "text-destructive";
  if (ratio >= 0.7) return "text-accent";
  return "text-primary";
}

function spotsLabel(trip: TripWithClub): string {
  if (trip.maxParticipants === null) return "Vende të pakufizuara";
  const left = Math.max(0, trip.maxParticipants - trip.confirmedCount);
  return left === 0 ? "Plot — listë pritjeje" : `${left} vende të lira`;
}

const WEATHER_BADGE: Record<string, { className: string; label: string }> = {
  warning: { className: "bg-yellow-100 text-yellow-900", label: "⚠️" },
  alert: { className: "bg-orange-100 text-orange-900", label: "🟠" },
  danger: {
    className: "bg-red-100 text-red-900",
    label: "🔴 Kushte të rrezikshme",
  },
};

export function TripCard({ trip }: { trip: TripWithClub }) {
  const free = Number(trip.priceEur) === 0;
  const weather = WEATHER_BADGE[trip.weatherAlertLevel];

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 space-y-3 pt-6">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-muted-foreground">
            {trip.club.name}
          </span>
          {trip.difficulty ? (
            <DifficultyBadge difficulty={trip.difficulty} />
          ) : null}
        </div>

        {weather ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${weather.className}`}
          >
            {weather.label}
          </span>
        ) : null}

        <h3 className="font-semibold leading-tight">{trip.title}</h3>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatTripDate(trip.startDatetime)}
          </p>
          {trip.club.city ? (
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {trip.club.city}
            </p>
          ) : null}
          <p className={`flex items-center gap-1.5 ${spotsTone(trip)}`}>
            <Users className="size-3.5" />
            {spotsLabel(trip)}
          </p>
        </div>

        <div className="text-lg font-bold">
          {free ? (
            <span className="text-primary">Falas</span>
          ) : (
            <span>€{trip.priceEur}</span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          render={<Link href={`/trips/${trip.slug}`} />}
        >
          Shiko Udhëtimin
          <ArrowRight />
        </Button>
      </CardFooter>
    </Card>
  );
}
