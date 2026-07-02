import { ArrowRight, Clock, MapPin, TrendingUp } from "lucide-react";
import Link from "next/link";

import { CloudImage } from "@/components/features/images/cloud-image";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Trail } from "@/lib/db/schema";
import { featureLabels } from "@/lib/i18n/labels";

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} orë`;
}

export function TrailCard({ trail }: { trail: Trail }) {
  const features = trail.features ?? [];
  const visibleFeatures = features.slice(0, 3);
  const extraFeatures = features.length - visibleFeatures.length;
  const duration = formatDuration(trail.estimatedDurationMin);

  return (
    <Card className="flex flex-col overflow-hidden pt-0">
      {/* Cover */}
      <div className="relative h-40">
        <CloudImage
          publicId={trail.coverImageUrl}
          size="thumbnail"
          alt={trail.name}
          fallback="trail"
          className="h-full w-full"
        />
        <div className="absolute top-3 left-3">
          <DifficultyBadge difficulty={trail.difficulty} />
        </div>
        {trail.verified ? (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-primary">
            ✓ Verifikuar
          </span>
        ) : null}
      </div>

      <CardContent className="flex-1 space-y-3">
        <div>
          <h3 className="font-semibold leading-tight">{trail.name}</h3>
          {(trail.region || trail.city) && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {[trail.region, trail.city].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {trail.distanceKm ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {trail.distanceKm} km
            </span>
          ) : null}
          {trail.elevationGainM ? (
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="size-3.5" />
              {trail.elevationGainM} m
            </span>
          ) : null}
          {duration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {duration}
            </span>
          ) : null}
        </div>

        {visibleFeatures.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {visibleFeatures.map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {featureLabels[feature] ?? feature}
              </span>
            ))}
            {extraFeatures > 0 ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                +{extraFeatures}
              </span>
            ) : null}
          </div>
        ) : null}
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          render={<Link href={`/trails/${trail.slug}`} />}
        >
          Shiko shtigun
          <ArrowRight />
        </Button>
      </CardFooter>
    </Card>
  );
}
