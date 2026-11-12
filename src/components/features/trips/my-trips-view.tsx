"use client";

import { CalendarDays, Heart, Loader2, MapPin } from "lucide-react";
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
import type { FavoriteTrip } from "@/server/queries/favorites";
import type { RegisteredTrip } from "@/server/queries/trips";

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function MyTripsView({
  upcoming,
  past,
  waitlisted,
  saved,
}: {
  upcoming: RegisteredTrip[];
  past: RegisteredTrip[];
  waitlisted: RegisteredTrip[];
  saved: FavoriteTrip[];
}) {
  return (
    <Tabs defaultValue="upcoming" className="flex flex-col">
      <TabsList className="scrollbar-hide w-full justify-start overflow-x-auto border-b">
        <TabsTrigger value="upcoming" className="flex-none shrink-0 whitespace-nowrap">
          Të ardhshme
        </TabsTrigger>
        <TabsTrigger value="past" className="flex-none shrink-0 whitespace-nowrap">
          Të kaluara
        </TabsTrigger>
        <TabsTrigger value="waitlisted" className="flex-none shrink-0 whitespace-nowrap">
          Lista e pritjes
        </TabsTrigger>
        <TabsTrigger value="saved" className="flex-none shrink-0 whitespace-nowrap">
          <Heart className="mr-1.5 size-3.5" />
          Të ruajtura
        </TabsTrigger>
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
      <TabsContent value="saved" className="space-y-3 pt-6">
        <SavedList items={saved} />
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
      <div className="rounded-xl border border-dashed px-6 py-10 text-center">
        <p className="text-muted-foreground text-sm">
          {variant === "upcoming"
            ? "Nuk jeni regjistruar ende në asnjë udhëtim të ardhshëm."
            : variant === "past"
              ? "Udhëtimet ku keni marrë pjesë do të shfaqen këtu."
              : "Nuk jeni në asnjë listë pritjeje."}
        </p>
        {variant !== "past" ? (
          <Link
            href="/trips"
            className="text-primary mt-3 inline-block text-sm font-medium hover:underline"
          >
            Zbuloni udhëtime →
          </Link>
        ) : null}
      </div>
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

function SavedList({ items }: { items: FavoriteTrip[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-10 text-center">
        <p className="text-muted-foreground text-sm">
          Asnjë udhëtim i ruajtur.
        </p>
        <Link
          href="/trips"
          className="text-primary mt-3 inline-block text-sm font-medium hover:underline"
        >
          Zbuloni udhëtime →
        </Link>
      </div>
    );
  }
  return (
    <>
      {items.map((item) => (
        <Card key={item.trip.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <Link
                href={`/trips/${item.trip.slug}`}
                className="font-medium hover:underline"
              >
                {item.trip.title}
              </Link>
              <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                <span>{item.clubName}</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {formatTripDate(item.trip.startDatetime)}
                </span>
              </p>
            </div>
            <span className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
              <Heart className="size-3 fill-current" />
              E ruajtur
            </span>
          </CardContent>
        </Card>
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
    const question =
      variant === "waitlisted"
        ? "Doni të dilni nga lista e pritjes për këtë udhëtim?"
        : "Doni ta anuloni regjistrimin për këtë udhëtim?";
    if (!confirm(question)) return;
    setLoading(true);
    const result = await cancelMyRegistration(item.registrationId);
    setLoading(false);
    if (!result.success) {
      alert(result.error ?? "Regjistrimi nuk u anulua. Provoni sërish.");
      return;
    }
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
            // "Past" means the start time has passed; uploads open only once
            // the trip is marked completed, so don't offer a button the server
            // will refuse.
            item.trip.status === "completed" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpload((v) => !v)}
              >
                Shtoni Kujtimet Tuaja
              </Button>
            ) : (
              <span className="text-muted-foreground text-xs">
                Fotot mund të shtohen pasi udhëtimi të përfundojë.
              </span>
            )
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={cancel}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : null}
              {variant === "waitlisted" ? "Hiqni nga Lista" : "Anuloni"}
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
