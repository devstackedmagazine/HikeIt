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
import { LinkedAccounts } from "@/components/features/profile/linked-accounts";
import { ProfileForm } from "@/components/features/profile/profile-form";
import { LogoutButton } from "@/components/shared/logout-button";
import { getRequiredUser } from "@/lib/auth/helpers";
import { getSocialErrorCopy, providerLabel } from "@/lib/auth/social-errors";
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
      <span className="bg-moss h-[18px] w-[3px]" />
      <h2 className="text-summit text-[11px] font-bold tracking-[0.08em] uppercase">
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
    <div className="border-summit/8 bg-summit/[0.04] border p-4">
      <p className="text-summit/30 mb-1.5 text-[8px] font-semibold tracking-[0.12em] uppercase">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="font-heading text-summit text-[26px] leading-none font-extrabold tracking-[-0.02em]">
          {value}
        </span>
        {icon}
      </div>
    </div>
  );
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ linked?: string; error?: string }>;
}) {
  const user = await getRequiredUser();
  const profile = await getUserProfile(user.id);
  if (!profile) notFound();

  const { linked, error } = await searchParams;
  const linkNotice = error
    ? { tone: "error" as const, message: getSocialErrorCopy(error).message }
    : linked
      ? {
          tone: "success" as const,
          message: `${providerLabel(linked) ?? linked} u lidh me sukses!`,
        }
      : null;

  const displayName = (profile.name ?? profile.email).toUpperCase();
  const clubsById = new Map(profile.clubs.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <p className="text-summit/35 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.08em] uppercase">
        <Link href="/dashboard" className="hover:text-summit/60">
          Dashboard
        </Link>
        <span className="text-summit/20">/</span>
        <span className="text-summit/60">Profili</span>
      </p>

      {/* Header card */}
      <div className="border-summit/10 bg-summit/[0.04] flex flex-col items-center gap-4 border px-5 py-4 text-center sm:flex-row sm:flex-wrap sm:items-start sm:text-left">
        <span className="bg-abyss flex size-20 shrink-0 items-center justify-center overflow-hidden">
          {profile.avatarUrl ? (
            <span
              className="size-full bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.avatarUrl})` }}
            />
          ) : (
            <span className="font-heading text-moss text-[28px] font-bold">
              {(profile.name ?? profile.email).charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <span className="border-moss/30 bg-moss/15 text-moss inline-block border px-2.5 py-[3px] text-[9px] font-bold tracking-[0.1em] uppercase">
            {ROLE_LABELS[profile.role] ?? profile.role}
          </span>
          <h1 className="font-heading text-summit mt-2 text-[clamp(20px,3vw,32px)] leading-[1.2] font-extrabold tracking-[-0.02em] uppercase">
            {displayName}
          </h1>
          <p className="text-summit/45 mt-1 text-xs">{profile.email}</p>
          <p className="text-summit/30 mt-2 text-[9px] font-medium tracking-[0.02em] uppercase sm:text-[10px] sm:tracking-[0.06em]">
            {memberSince(profile.memberSince)}
          </p>
        </div>

        <Link
          href="#edit-profile"
          className="border-summit/40 text-summit/60 hover:border-summit/60 hover:text-summit/80 flex w-full items-center justify-center border px-4 py-2.5 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors sm:w-auto"
        >
          Ndrysho profilin →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat
          label="Udhëtime"
          value={profile.tripsCount}
          icon={<Mountain className="text-summit/25 size-3.5" />}
        />
        <Stat
          label="Klube"
          value={profile.clubsCount}
          icon={<Users className="text-summit/25 size-3.5" />}
        />
        <Stat
          label="Vlerësime"
          value={profile.reviewsCount}
          icon={<Star className="text-summit/25 size-3.5" />}
        />
        <Stat
          label="Kilometra"
          value={profile.totalKmHiked}
          icon={
            <span className="text-summit/25 text-[10px] font-semibold uppercase">
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
                    className="border-summit/8 bg-summit/[0.04] flex items-center gap-2.5 border p-3"
                  >
                    <span className="bg-abyss text-moss flex size-8 shrink-0 items-center justify-center">
                      <Mountain className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-summit truncate text-xs font-bold uppercase">
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
                    <ChevronRight className="text-summit/20 size-3.5 shrink-0" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="border-summit/8 bg-summit/[0.03] text-summit/40 border px-4 py-6 text-center text-xs">
              Nuk je anëtar i asnjë klubi ende.
            </p>
          )}

          {/* Recent trips */}
          <div className="mt-4">
            <AccentHeader>Udhëtime të fundit</AccentHeader>
            {profile.recentTrips.length > 0 ? (
              <div className="border-summit/8 bg-summit/[0.03] border">
                <div className="border-summit/8 bg-summit/[0.05] text-summit/30 grid grid-cols-[1fr_2fr_1.5fr_0.5fr] gap-2 border-b px-3.5 py-2 text-[8px] font-semibold tracking-[0.12em] uppercase">
                  <span>Data</span>
                  <span>Udhëtimi</span>
                  <span>Klubi</span>
                  <span />
                </div>
                {profile.recentTrips.slice(0, 3).map((trip) => (
                  <div
                    key={trip.id}
                    className="border-summit/[0.05] grid grid-cols-[1fr_2fr_1.5fr_0.5fr] items-center gap-2 border-b px-3.5 py-2.5 last:border-b-0"
                  >
                    <span className="text-summit/40 text-[10px] font-medium tracking-[0.02em] uppercase">
                      {rowDate(trip.startDatetime)}
                    </span>
                    <span className="font-heading text-summit text-[11px] font-bold uppercase">
                      {trip.title}
                    </span>
                    <span className="text-summit/45 text-[10px]">
                      {clubsById.get(trip.organizationId) ?? "—"}
                    </span>
                    <Link
                      href={`/trips/${trip.slug}`}
                      aria-label="Shiko udhëtimin"
                      className="text-summit/25 hover:text-moss flex justify-end"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="border-summit/8 bg-summit/[0.03] text-summit/40 border px-4 py-6 text-center text-xs">
                Ende pa udhëtime.
              </p>
            )}
          </div>
        </div>

        {/* Right — account */}
        <aside className="border-summit/8 bg-summit/[0.03] flex flex-col gap-4 border p-4">
          <div className="flex items-center gap-2">
            <Shield className="text-moss size-3.5" />
            <span className="text-summit text-[11px] font-bold tracking-[0.1em] uppercase">
              Llogaria
            </span>
          </div>

          <ChangePasswordRow />
          <LinkedAccounts
            linkedProviders={profile.linkedProviders}
            initialNotice={linkNotice}
          />
          <AlertSensitivityToggle
            initial={profile.preferences?.alertSensitivity}
          />
          <LanguageToggle initial={profile.preferences?.language} />
          <LogoutButton variant="brutalist" />
          <DeleteAccountButton email={profile.email} />
        </aside>
      </div>

      {/* Edit profile (existing form) */}
      <div
        id="edit-profile"
        className="border-summit/8 bg-summit/[0.03] border p-4"
      >
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
