"use client";

import { CalendarDays, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TripPhotosManager } from "@/components/features/trips/trip-photos-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/cn";
import { formatTripDate } from "@/lib/utils/datetime";
import { cancelMyRegistration } from "@/server/actions/trip-registrations";
import type { RegisteredTrip } from "@/server/queries/trips";

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function MyTripsView({
  upcoming,
  past,
  waitlisted,
}: {
  upcoming: RegisteredTrip[];
  past: RegisteredTrip[];
  waitlisted: RegisteredTrip[];
}) {
  return (
    <Tabs defaultValue="upcoming" className="flex flex-col">
      <TabsList className="w-full justify-start border-b">
        <TabsTrigger value="upcoming">Të ardhshme</TabsTrigger>
        <TabsTrigger value="past">Të kaluara</TabsTrigger>
        <TabsTrigger value="waitlisted">Lista e pritjes</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="space-y-3 pt-6">
        <List items={upcoming} variant="upcoming" />
      </TabsContent>
      <TabsContent value="past" className="space-y-3 pt-6">
        <List items={past} variant="past" />
      </TabsContent>
      <TabsContent value="waitlisted" className="space-y-3 pt-6">
        <List items={waitlisted} variant="waitlisted" />
      </TabsContent>
    </Tabs>
  );
}

function List({
  items,
  variant,
}: {
  items: RegisteredTrip[];
  variant: "upcoming" | "past" | "waitlisted";
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed px-6 py-10 text-center text-sm">
        {variant === "upcoming"
          ? "Asnjë udhëtim i ardhshëm."
          : variant === "past"
            ? "Asnjë udhëtim i kaluar."
            : "Nuk je në asnjë listë pritjeje."}
      </p>
    );
  }
  return (
    <>
      {items.map((item) => (
        <TripRow key={item.registrationId} item={item} variant={variant} />
      ))}
    </>
  );
}

function TripRow({
  item,
  variant,
}: {
  item: RegisteredTrip;
  variant: "upcoming" | "past" | "waitlisted";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const days = daysUntil(item.trip.startDatetime);

  async function cancel() {
    if (!confirm("Konfirmo veprimin?")) return;
    setLoading(true);
    await cancelMyRegistration(item.registrationId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Card className={cn(variant === "past" && "opacity-70")}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <Link
            href={`/trips/${item.trip.slug}`}
            className="font-medium hover:underline"
          >
            {item.trip.title}
          </Link>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 text-sm">
            <span>{item.club.name}</span>
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {formatTripDate(item.trip.startDatetime)}
            </span>
            {item.trip.meetingPoint ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {item.trip.meetingPoint}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {variant === "upcoming" && days >= 0 ? (
            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
              {days === 0 ? "Sot" : `${days} ditë`}
            </span>
          ) : null}
          {variant === "waitlisted" ? (
            <span className="bg-accent/15 text-accent rounded-full px-2.5 py-0.5 text-xs font-medium">
              Në pritje
            </span>
          ) : null}
          {variant === "past" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload((v) => !v)}
            >
              Shto Kujtimet Tuaja
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={cancel}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : null}
              {variant === "waitlisted" ? "Hiq nga Lista" : "Anulo"}
            </Button>
          )}
        </div>

        {variant === "past" && showUpload ? (
          <div className="w-full border-t pt-4">
            <TripPhotosManager tripId={item.trip.id} photos={[]} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
