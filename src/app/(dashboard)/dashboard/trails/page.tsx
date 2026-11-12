import { Map } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CloudImage } from "@/components/features/images/cloud-image";
import { ProposeTrailLink } from "@/components/features/trails/propose-trail-link";
import { TrailFavoriteButton } from "@/components/features/trails/trail-favorite-button";
import { EmptyState } from "@/components/shared/empty-state";
import { getRequiredUser } from "@/lib/auth/helpers";
import type { Trail } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";
import { getUserFavoriteTrails } from "@/server/queries/favorites";

export const metadata: Metadata = { title: "Shtigjet e ruajtura" };

const DIFFICULTY_BADGE: Record<
  Trail["difficulty"],
  { letter: string; className: string }
> = {
  easy: { letter: "L", className: "bg-moss text-abyss" },
  moderate: { letter: "M", className: "bg-alert text-abyss" },
  hard: { letter: "V", className: "bg-sunset text-summit" },
  expert: { letter: "E", className: "bg-danger text-summit" },
};

export default async function SavedTrailsPage() {
  const user = await getRequiredUser();
  const trails = await getUserFavoriteTrails(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-forest text-xl font-black tracking-[-0.01em] uppercase">
          Shtigjet e Ruajtura
        </h1>
        {/* This page requires a session, so the viewer is always logged in. */}
        <ProposeTrailLink isLoggedIn />
      </div>

      {trails.length === 0 ? (
        <EmptyState
          icon={Map}
          title="Asnjë shteg i ruajtur"
          description="Ruani shtigjet që dëshironi t'i vizitoni më vonë."
          action={{ label: "Zbuloni shtigjet", href: "/trails" }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trails.map((trail) => {
            const badge = DIFFICULTY_BADGE[trail.difficulty];
            const dist = trail.distanceKm
              ? Number(trail.distanceKm).toFixed(1)
              : null;
            return (
              <div
                key={trail.id}
                className="group border-forest/12 bg-summit relative overflow-hidden border"
              >
                <Link href={`/trails/${trail.slug}`}>
                  <div className="relative h-[140px] overflow-hidden">
                    <CloudImage
                      publicId={trail.coverImageUrl}
                      size="thumbnail"
                      alt={trail.name}
                      fallback="trail"
                      className="h-full w-full"
                    />
                    <span
                      className={cn(
                        "absolute top-2 left-2 px-2 py-0.5 text-[10px] font-extrabold uppercase",
                        badge.className,
                      )}
                    >
                      {badge.letter}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-heading text-forest text-[13px] font-extrabold uppercase">
                      {trail.name}
                    </h3>
                    <p className="text-forest/45 mt-1 text-[10px] font-medium">
                      {dist ? `${dist} KM` : "—"}
                      {trail.elevationGainM != null
                        ? ` · ${trail.elevationGainM}M NGJITJE`
                        : ""}
                    </p>
                  </div>
                </Link>
                <div className="absolute top-2 right-2 z-10">
                  <TrailFavoriteButton
                    trailId={trail.id}
                    isSaved={true}
                    isLoggedIn={true}
                    returnPath="/dashboard/trails"
                    className="size-8"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
