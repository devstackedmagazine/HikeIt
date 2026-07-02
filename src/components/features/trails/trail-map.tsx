"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";

export interface TrailMapProps {
  startLat: number | string;
  startLng: number | string;
  endLat?: number | string | null;
  endLng?: number | string | null;
  trailName: string;
  /** Optional full route as [lat, lng] pairs — draws a polyline if provided. */
  route?: [number, number][];
}

/**
 * Colored teardrop pin as an inline-SVG `divIcon`. Using divIcons (instead of
 * Leaflet's default PNG marker) avoids the well-known marker-icon 404 in
 * bundlers and lets us color start (green) vs end (red) to match the brand.
 */
function pinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg width="28" height="40" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/><circle cx="12" cy="12" r="4.5" fill="#ffffff"/></svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

const startIcon = pinIcon("#2D5F3F");
const endIcon = pinIcon("#E11D48");

export function TrailMap({
  startLat,
  startLng,
  endLat,
  endLng,
  trailName,
  route,
}: TrailMapProps) {
  const start: [number, number] = [Number(startLat), Number(startLng)];
  const hasEnd =
    endLat != null &&
    endLng != null &&
    (Number(endLat) !== start[0] || Number(endLng) !== start[1]);
  const end: [number, number] | null = hasEnd
    ? [Number(endLat), Number(endLng)]
    : null;
  const hasRoute = route != null && route.length > 1;
  const bounds = hasRoute ? L.latLngBounds(route) : undefined;

  return (
    <MapContainer
      center={start}
      zoom={13}
      bounds={bounds}
      scrollWheelZoom={false}
      style={{ height: "400px", width: "100%" }}
      className="z-0 rounded-xl border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasRoute ? (
        <Polyline positions={route} pathOptions={{ color: "#2D5F3F", weight: 4 }} />
      ) : null}
      <Marker position={start} icon={startIcon}>
        <Popup>Start: {trailName}</Popup>
      </Marker>
      {end ? (
        <Marker position={end} icon={endIcon}>
          <Popup>End: {trailName}</Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
