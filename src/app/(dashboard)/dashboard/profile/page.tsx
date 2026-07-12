import {
  ArrowUpRight,
  ChevronRight,
  Mountain,
  Shield,
  Star,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AlertSensitivityToggle } from "@/components/features/profile/alert-sensitivity-toggle";
import { ChangePasswordRow } from "@/components/features/profile/change-password-row";
import { DeleteAccountButton } from "@/components/features/profile/delete-account-button";
import { LanguageToggle } from "@/components/features/profile/language-toggle";
import { ProfileForm } from "@/components/features/profile/profile-form";
import { getRequiredUser } from "@/lib/auth/helpers";
import { cn } from "@/lib/utils/cn";
import { getUserProfile } from "@/server/queries/users";

export const metadata: Metadata = { title: "Profili" };

const ROLE_LABELS: Record<string, string> = {
  hiker: "Alpinist",
  club_admin: "Organizator",
  super_admin: "Admin",
};

function memberSince(date: Date): string {
  return `Anëtar që nga ${new Intl.DateTimeFormat("sq-AL", {
    month: "long",
    year: "numeric",
  }).format(date)}`.toUpperCase();
}

function rowDate(date: Date): string {
  return new Intl.DateTimeFormat("sq-AL", { day: "2-digit", month: "long" })
    .format(date)
    .concat(`, ${date.getFullYear()}`)
    .toUpperCase();
}

function AccentHeader({ children }: { children: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-[18px] w-[3px] bg-moss" />
      <h2 className="text-[11px] font-bold tracking-[0.08em] text-summit uppercase">
        {children}
      </h2>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="border border-summit/8 bg-summit/[0.04] p-4">
      <p className="mb-1.5 text-[8px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="font-heading text-[26px] leading-none font-extrabold tracking-[-0.02em] text-summit">
          {value}
        </span>
        {icon}
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const user = await getRequiredUser();
  const profile = await getUserProfile(user.id);
  if (!profile) notFound();

  const displayName = (profile.name ?? profile.email).toUpperCase();
  const clubsById = new Map(profile.clubs.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.08em] text-summit/35 uppercase">
        <Link href="/dashboard" className="hover:text-summit/60">
          Dashboard
        </Link>
        <span className="text-summit/20">/</span>
        <span className="text-summit/60">Profili</span>
      </p>

      {/* Header card */}
      <div className="flex flex-col items-center gap-4 border border-summit/10 bg-summit/[0.04] px-5 py-4 text-center sm:flex-row sm:flex-wrap sm:items-start sm:text-left">
        <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden bg-abyss">
          {profile.avatarUrl ? (
            <span
              className="size-full bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.avatarUrl})` }}
            />
          ) : (
            <span className="font-heading text-[28px] font-bold text-moss">
              {(profile.name ?? profile.email).charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <span className="inline-block border border-moss/30 bg-moss/15 px-2.5 py-[3px] text-[9px] font-bold tracking-[0.1em] text-moss uppercase">
            {ROLE_LABELS[profile.role] ?? profile.role}
          </span>
          <h1 className="font-heading mt-2 text-[clamp(20px,3vw,32px)] leading-none font-extrabold tracking-[-0.02em] text-summit uppercase">
            {displayName}
          </h1>
          <p className="mt-1 text-xs text-summit/45">{profile.email}</p>
          <p className="mt-2 text-[9px] font-medium tracking-[0.02em] text-summit/30 uppercase sm:text-[10px] sm:tracking-[0.06em]">
            {memberSince(profile.memberSince)}
          </p>
        </div>

        <Link
          href="#edit-profile"
          className="flex w-full items-center justify-center border border-summit/25 px-4 py-2.5 text-[10px] font-bold tracking-[0.08em] text-summit/60 uppercase transition-colors hover:border-summit/40 hover:text-summit/80 sm:w-auto"
        >
          Ndrysho profilin →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat
          label="Udhëtime"
          value={profile.tripsCount}
          icon={<Mountain className="size-3.5 text-summit/25" />}
        />
        <Stat
          label="Klube"
          value={profile.clubsCount}
          icon={<Users className="size-3.5 text-summit/25" />}
        />
        <Stat
          label="Vlerësime"
          value={profile.reviewsCount}
          icon={<Star className="size-3.5 text-summit/25" />}
        />
        <Stat
          label="Kilometra"
          value={profile.totalKmHiked}
          icon={
            <span className="text-[10px] font-semibold text-summit/25 uppercase">
              km
            </span>
          }
        />
      </div>

      {/* Two-column */}
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        {/* Left */}
        <div>
          {/* Clubs */}
          <AccentHeader>Klubet e mia</AccentHeader>
          {profile.clubs.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {profile.clubs.map((club) => {
                const isOrganizer = club.memberRole !== "member";
                return (
                  <Link
                    key={club.id}
                    href={`/clubs/${club.slug}`}
                    className="flex items-center gap-2.5 border border-summit/8 bg-summit/[0.04] p-3"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center bg-abyss text-moss">
                      <Mountain className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading truncate text-xs font-bold text-summit uppercase">
                        {club.name}
                      </p>
                      <span
                        className={cn(
                          "mt-1 inline-block border px-[7px] py-0.5 text-[8px] font-bold tracking-[0.08em] uppercase",
                          isOrganizer
                            ? "border-moss/25 bg-moss/15 text-moss"
                            : "border-summit/15 bg-summit/[0.06] text-summit/50",
                        )}
                      >
                        {isOrganizer ? "Organizator" : "Anëtar"}
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 shrink-0 text-summit/20" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="border border-summit/8 bg-summit/[0.03] px-4 py-6 text-center text-xs text-summit/40">
              Nuk je anëtar i asnjë klubi ende.
            </p>
          )}

          {/* Recent trips */}
          <div className="mt-4">
            <AccentHeader>Udhëtime të fundit</AccentHeader>
            {profile.recentTrips.length > 0 ? (
              <div className="border border-summit/8 bg-summit/[0.03]">
                <div className="grid grid-cols-[1fr_2fr_1.5fr_0.5fr] gap-2 border-b border-summit/8 bg-summit/[0.05] px-3.5 py-2 text-[8px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
                  <span>Data</span>
                  <span>Udhëtimi</span>
                  <span>Klubi</span>
                  <span />
                </div>
                {profile.recentTrips.slice(0, 3).map((trip) => (
                  <div
                    key={trip.id}
                    className="grid grid-cols-[1fr_2fr_1.5fr_0.5fr] items-center gap-2 border-b border-summit/[0.05] px-3.5 py-2.5 last:border-b-0"
                  >
                    <span className="text-[10px] font-medium tracking-[0.02em] text-summit/40 uppercase">
                      {rowDate(trip.startDatetime)}
                    </span>
                    <span className="font-heading text-[11px] font-bold text-summit uppercase">
                      {trip.title}
                    </span>
                    <span className="text-[10px] text-summit/45">
                      {clubsById.get(trip.organizationId) ?? "—"}
                    </span>
                    <Link
                      href={`/trips/${trip.slug}`}
                      aria-label="Shiko udhëtimin"
                      className="flex justify-end text-summit/25 hover:text-moss"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="border border-summit/8 bg-summit/[0.03] px-4 py-6 text-center text-xs text-summit/40">
                Ende pa udhëtime.
              </p>
            )}
          </div>
        </div>

        {/* Right — account */}
        <aside className="flex flex-col gap-4 border border-summit/8 bg-summit/[0.03] p-4">
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 text-moss" />
            <span className="text-[11px] font-bold tracking-[0.1em] text-summit uppercase">
              Llogaria
            </span>
          </div>

          <ChangePasswordRow />
          <AlertSensitivityToggle
            initial={profile.preferences?.alertSensitivity}
          />
          <LanguageToggle initial={profile.preferences?.language} />
          <DeleteAccountButton email={profile.email} />
        </aside>
      </div>

      {/* Edit profile (existing form) */}
      <div id="edit-profile" className="border border-summit/8 bg-summit/[0.03] p-4">
        <AccentHeader>Ndrysho profilin</AccentHeader>
        <ProfileForm
          avatarUrl={profile.avatarUrl}
          initial={{
            name: profile.name ?? "",
            bio: profile.bio ?? "",
            phone: profile.phone ?? "",
            dateOfBirth: profile.dateOfBirth ?? "",
            emergencyContactName: profile.emergencyContactName ?? "",
            emergencyContactPhone: profile.emergencyContactPhone ?? "",
            language: profile.preferences?.language ?? "sq",
            alertSensitivity: profile.preferences?.alertSensitivity ?? "low",
          }}
        />
      </div>
    </div>
  );
}
