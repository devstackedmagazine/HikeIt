"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

/** Classic red teardrop pin (inline SVG divIcon — avoids bundler 404s). */
const redIcon = L.divIcon({
  className: "",
  html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z" fill="#C0392B" stroke="#ffffff" stroke-width="1.5"/><circle cx="12" cy="12" r="4.5" fill="#ffffff"/></svg>`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});

function ClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function ClickableMap({
  initial,
  onSelect,
}: {
  initial?: { lat: number; lng: number } | null;
  onSelect: (lat: number, lng: number) => void;
}) {
  const [marker, setMarker] = useState<[number, number] | null>(
    initial ? [initial.lat, initial.lng] : null,
  );

  return (
    <MapContainer
      center={marker ?? [42.6, 21.0]}
      zoom={7}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler
        onSelect={(lat, lng) => {
          setMarker([lat, lng]);
          onSelect(lat, lng);
        }}
      />
      {marker ? <Marker position={marker} icon={redIcon} /> : null}
    </MapContainer>
  );
}
