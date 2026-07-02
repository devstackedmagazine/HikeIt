"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  cancelMyRegistration,
  registerForTrip,
} from "@/server/actions/trip-registrations";

export interface RegisterCardProps {
  tripId: string;
  slug: string;
  isLoggedIn: boolean;
  isPast: boolean;
  isFull: boolean;
  priceEur: string;
  spotsLabel: string;
  registration: { id: string; status: string } | null;
}

export function RegisterCard({
  tripId,
  slug,
  isLoggedIn,
  isPast,
  isFull,
  priceEur,
  spotsLabel,
  registration,
}: RegisterCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const free = Number(priceEur) === 0;
  const isRegistered =
    registration !== null && registration.status !== "canceled";

  async function register() {
    setLoading(true);
    setError(null);
    const result = await registerForTrip(tripId);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    router.refresh();
  }

  async function cancel() {
    if (!registration) return;
    setLoading(true);
    await cancelMyRegistration(registration.id);
    setLoading(false);
    router.refresh();
  }

  return (
    <Card className="lg:sticky lg:top-20">
      <CardContent className="space-y-4 py-6">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">
            {free ? "Falas" : `€${priceEur}`}
          </span>
          <span className="text-sm text-muted-foreground">{spotsLabel}</span>
        </div>

        {isPast ? (
          <Button disabled className="w-full">
            Udhëtimi ka mbaruar
          </Button>
        ) : !isLoggedIn ? (
          <Button
            className="w-full"
            render={<Link href={`/login?redirect=/trips/${slug}`} />}
          >
            Kyçu për t&apos;u regjistruar
          </Button>
        ) : isRegistered ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 py-2 text-sm font-medium text-primary">
              <CheckCircle2 className="size-4" />
              {registration?.status === "waitlisted"
                ? "Në listën e pritjes"
                : "Regjistruar ✓"}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={cancel}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : null}
              Anulo regjistrimin
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={register} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            {isFull ? "Lista e pritjes" : "Regjistrohu"}
          </Button>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
