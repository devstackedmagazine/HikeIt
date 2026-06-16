"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { MapPinned } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

import { env } from "@/config/env";

export interface TrailMapProps {
  name: string;
  startLat: number;
  startLng: number;
  endLat?: number | null;
  endLng?: number | null;
}

/** Build a small colored pin element with a single-letter label. */
function createPin(label: string, color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    display:flex;align-items:center;justify-content:center;
    width:28px;height:28px;border-radius:9999px;
    background:${color};color:#fff;font-weight:700;font-size:13px;
    border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);
  `;
  el.textContent = label;
  return el;
}

export default function TrailMap({
  name,
  startLat,
  startLng,
  endLat,
  endLng,
}: TrailMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const token = env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [startLng, startLat],
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    new mapboxgl.Marker({ element: createPin("S", "#2D5F3F") })
      .setLngLat([startLng, startLat])
      .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(`${name} — Fillimi`))
      .addTo(map);

    const hasEnd = typeof endLat === "number" && typeof endLng === "number";
    if (hasEnd) {
      new mapboxgl.Marker({ element: createPin("E", "#E11D48") })
        .setLngLat([endLng, endLat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(`${name} — Fundi`))
        .addTo(map);
      const bounds = new mapboxgl.LngLatBounds()
        .extend([startLng, startLat])
        .extend([endLng, endLat]);
      map.fitBounds(bounds, { padding: 64, maxZoom: 13 });
    }

    map.on("load", () => setLoaded(true));

    return () => map.remove();
  }, [token, name, startLat, startLng, endLat, endLng]);

  if (!token) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center gap-2 rounded-xl border bg-muted/40 text-center text-muted-foreground">
        <MapPinned className="size-8" />
        <p className="text-sm">
          Harta nuk është e disponueshme — mungon NEXT_PUBLIC_MAPBOX_TOKEN.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-xl border">
      {!loaded ? (
        <div className="absolute inset-0 z-10 animate-pulse bg-muted" />
      ) : null}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
