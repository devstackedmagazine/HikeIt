"use client";

import dynamic from "next/dynamic";

import { TrailMapSkeleton } from "@/components/features/trails/trail-map-skeleton";

/**
 * Loads the Leaflet map only on the client — Leaflet touches `window`, so it
 * must never be server-rendered. Server pages import `TrailMap` from here.
 */
const TrailMap = dynamic(
  () =>
    import("@/components/features/trails/trail-map").then((mod) => mod.TrailMap),
  {
    ssr: false,
    loading: () => <TrailMapSkeleton />,
  },
);

export { TrailMap };
