import { Calendar, Star, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatCard } from "@/components/features/dashboard/stat-card";
import { AccountSection } from "@/components/features/profile/account-section";
import { ProfileForm } from "@/components/features/profile/profile-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRequiredUser } from "@/lib/auth/helpers";
import { memberRoleLabels } from "@/lib/i18n/labels";
import { formatTripDate } from "@/lib/utils/datetime";
import { getUserProfile } from "@/server/queries/users";

export const metadata: Metadata = { title: "Profili" };

const ROLE_LABELS: Record<string, string> = {
  hiker: "Hiker",
  club_admin: "Administrator klubi",
  super_admin: "Super Admin",
};

export default async function ProfilePage() {
  const user = await getRequiredUser();
  const profile = await getUserProfile(user.id);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt="Avatar"
              className="size-full object-cover"
            />
          ) : (
            (profile.name ?? profile.email).charAt(0).toUpperCase()
          )}
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.name ?? "Hiker"}
          </h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Anëtar që nga {formatTripDate(profile.memberSince)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Udhëtime" value={profile.tripsCount} />
        <StatCard icon={Users} label="Klube" value={profile.clubsCount} />
        <StatCard icon={Star} label="Vlerësime" value={profile.reviewsCount} />
        <StatCard
          icon={TrendingUp}
          label="km të hiked"
          value={profile.totalKmHiked}
        />
      </div>

      {/* Editable details */}
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
          alertSensitivity: profile.preferences?.alertSensitivity ?? "medium",
        }}
      />

      {/* My clubs */}
      {profile.clubs.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Klubet e mia</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {profile.clubs.map((club) => (
              <Card key={club.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{club.name}</p>
                    <Badge variant="secondary" className="mt-1">
                      {memberRoleLabels[club.memberRole]}
                    </Badge>
                  </div>
                  <Link
                    href={`/clubs/${club.slug}`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Shiko Klubin
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Recent trips */}
      {profile.recentTrips.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Udhëtimet e fundit</h2>
          <div className="space-y-2">
            {profile.recentTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.slug}`}
                className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
              >
                <span className="font-medium">{trip.title}</span>
                <span className="text-muted-foreground">
                  {formatTripDate(trip.startDatetime)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Account */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Llogaria</h2>
        <AccountSection email={profile.email} />
      </section>
    </div>
  );
}
