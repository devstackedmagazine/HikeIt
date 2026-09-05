import { Map } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CloudImage } from "@/components/features/images/cloud-image";
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
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-heading text-xl font-extrabold tracking-[-0.01em] text-summit uppercase">
        Shtigjet e Ruajtura
      </h1>

      {trails.length === 0 ? (
        <EmptyState
          icon={Map}
          title="Asnjë shteg i ruajtur"
          description="Ruaj shtigjet që dëshiron t'i vizitosh më vonë."
          action={{ label: "Zbulo shtigjet", href: "/trails" }}
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
                className="group relative overflow-hidden border border-summit/[0.08]"
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
                  <div className="bg-summit/[0.02] p-3">
                    <h3 className="font-heading text-[13px] font-extrabold text-summit uppercase">
                      {trail.name}
                    </h3>
                    <p className="mt-1 text-[10px] font-medium text-summit/45">
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
