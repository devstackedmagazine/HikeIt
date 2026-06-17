import { Check, Mountain, Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRequiredUser } from "@/lib/auth/helpers";
import {
  completeOnboardingAsHiker,
  startClubRegistration,
} from "@/server/actions/onboarding";

export const metadata: Metadata = { title: "Mirë se vini" };

const HIKER_POINTS = [
  "Gjej shtigje",
  "Bashkohu me udhëtime të klubeve",
  "Ndjek historikun tënd",
  "Merr njoftime moti",
];
const CLUB_POINTS = [
  "Menaxho anëtarët",
  "Krijo udhëtime",
  "Mbledh pagesa",
  "Dërgo njoftime",
];

export default async function OnboardingPage() {
  const user = await getRequiredUser();
  if (user.onboardingCompleted) redirect("/dashboard");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 text-center">
        <Brand className="text-2xl" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
          Si do ta përdorësh HikeIt?
        </h1>
        <p className="mt-1 text-muted-foreground">
          Mund ta ndryshosh këtë më vonë.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mountain className="size-6" />
            </div>
            <CardTitle>Jam Hiker</CardTitle>
            <CardDescription>
              Dua të zbuloj shtigje dhe të bashkohem me udhëtime
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm">
              {HIKER_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <form action={completeOnboardingAsHiker} className="w-full">
              <Button type="submit" className="w-full">
                Fillo si Hiker
              </Button>
            </form>
          </CardFooter>
        </Card>

        <Card className="flex flex-col border-primary/40">
          <CardHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Users className="size-6" />
            </div>
            <CardTitle>Përfaqësoj një Klub</CardTitle>
            <CardDescription>
              Dua të menaxhoj klubin tim dhe të organizoj udhëtime
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm">
              {CLUB_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <form action={startClubRegistration} className="w-full">
              <Button type="submit" variant="outline" className="w-full">
                Regjistro Klubin
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
