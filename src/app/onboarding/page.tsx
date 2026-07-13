import { CheckCircle, Mountain, Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getRequiredUser } from "@/lib/auth/helpers";
import {
  completeOnboardingAsHiker,
  startClubRegistration,
} from "@/server/actions/onboarding";

export const metadata: Metadata = { title: "Mirë se vini" };

const HIKER_POINTS = [
  "Gjej shtigje",
  "Bashkohu me udhëtime",
  "Ndiq historinë",
  "Merr alerts moti",
];
const CLUB_POINTS = [
  "Menaxho anëtarët",
  "Krijo udhëtime",
  "Mblidh pagesa",
  "Dërgo alerts",
];

const STATS = [
  { value: "4.8k+", label: "Hiker Aktiv" },
  { value: "120+", label: "Klube Alpike" },
  { value: "900+", label: "Shtigje Të Shkelura" },
];

export default async function OnboardingPage() {
  const user = await getRequiredUser();
  if (user.onboardingCompleted) redirect("/dashboard");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-abyss px-6 py-10">
      <h1 className="font-heading mb-3.5 text-center text-[clamp(36px,6vw,64px)] font-black tracking-[-0.03em] text-summit uppercase">
        Kush Jeni Ju?
      </h1>
      <p className="mx-auto mb-10 max-w-[440px] text-center text-[14px] text-summit/50">
        Zgjidhni identitetin tuaj alpin për të filluar rrugëtimin në botën e
        &ldquo;Wild &amp; Peace&rdquo;.
      </p>

      <div className="grid w-full max-w-[760px] gap-5 sm:grid-cols-2">
        {/* Hiker — Moss themed */}
        <div className="flex flex-col border-[1.5px] border-moss bg-moss/[0.06] p-8">
          <Mountain className="mb-4 size-12 text-moss" />
          <h2 className="font-heading mb-2 text-[18px] font-black tracking-[-0.01em] text-summit uppercase">
            Jam Hiker
          </h2>
          <p className="mb-5 text-[13px] text-summit/55">
            Dua të zbuloj shtigje dhe të bashkohem me udhëtime.
          </p>
          <ul className="mb-auto flex flex-col gap-2.5">
            {HIKER_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CheckCircle className="size-3.5 shrink-0 text-moss" />
                <span className="text-[11px] font-semibold tracking-[0.06em] text-moss uppercase">
                  {point}
                </span>
              </li>
            ))}
          </ul>
          <form action={completeOnboardingAsHiker} className="mt-6">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-moss py-3.5 text-[13px] font-extrabold tracking-[0.06em] text-abyss uppercase transition-colors hover:bg-pine hover:text-summit"
            >
              Fillo si Hiker →
            </button>
          </form>
        </div>

        {/* Club — Sunset themed */}
        <div className="flex flex-col border-[1.5px] border-sunset bg-sunset/[0.06] p-8">
          <Users className="mb-4 size-12 text-sunset" />
          <h2 className="font-heading mb-2 text-[18px] font-black tracking-[-0.01em] text-summit uppercase">
            Përfaqësoj Klub
          </h2>
          <p className="mb-5 text-[13px] text-summit/55">
            Dua të menaxhoj klubin tim dhe të organizoj udhëtime.
          </p>
          <ul className="mb-auto flex flex-col gap-2.5">
            {CLUB_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CheckCircle className="size-3.5 shrink-0 text-sunset" />
                <span className="text-[11px] font-semibold tracking-[0.06em] text-sunset uppercase">
                  {point}
                </span>
              </li>
            ))}
          </ul>
          <form action={startClubRegistration} className="mt-6">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-sunset py-3.5 text-[13px] font-extrabold tracking-[0.06em] text-summit uppercase transition-colors hover:bg-sunset/85"
            >
              Regjistro Klubin →
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-12 flex items-center justify-center gap-8 sm:gap-12">
        {STATS.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-8 sm:gap-12">
            {i > 0 ? <div className="h-10 w-px bg-summit/12" /> : null}
            <div className="text-center">
              <p className="font-heading text-[28px] font-black tracking-[-0.02em] text-summit">
                {stat.value}
              </p>
              <p className="mt-1 text-[9px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
