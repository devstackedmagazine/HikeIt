"use client";

import dynamic from "next/dynamic";

import type { TrailMapProps } from "@/components/features/trails/trail-map";

/**
 * Loads the Mapbox map only on the client — mapbox-gl touches `window`, so it
 * must never be server-rendered. This client wrapper is what server pages
 * import.
 */
const TrailMap = dynamic(
  () => import("@/components/features/trails/trail-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full animate-pulse rounded-xl border bg-muted" />
    ),
  },
);

export function TrailMapLoader(props: TrailMapProps) {
  return <TrailMap {...props} />;
}
