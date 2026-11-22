"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { directionsUrl, formatDistance } from "@/lib/geo";
import { STATUS } from "@/lib/status";

// Default view (Tunis) used when there is nothing to show yet.
const DEFAULT_CENTER = [36.8065, 10.1815];

// Builds a pin icon with plain HTML/CSS (styles are in globals.css).
// This avoids the well-known broken-marker-image problem of Leaflet + bundlers.
function pharmacyIcon(status) {
  return L.divIcon({
    className: "", // remove Leaflet's default white square
    html: `<div class="map-pin ${status === "low" ? "map-pin--low" : ""}"><span>+</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 38], // the tip of the pin sits on the exact position
    popupAnchor: [0, -34],
  });
}

// Zooms and moves the map so every marker is visible.
function FitBounds({ points }) {
  const map = useMap(); // gives access to the Leaflet map object

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);

  return null;
}

// Shows the pharmacies (and the user's position when known) on a map.
//   pharmacies: [{ id, name, address, latitude, longitude, status, distanceKm }]
//   userCoords: { lat, lng } or null
export default function PharmacyMap({ pharmacies, userCoords }) {
  // All the positions the map must show. useMemo avoids recomputing on every render.
  const points = useMemo(() => {
    const list = pharmacies.map((p) => [p.latitude, p.longitude]);
    if (userCoords) list.push([userCoords.lat, userCoords.lng]);
    return list;
  }, [pharmacies, userCoords]);

  return (
    <MapContainer
      center={points[0] || DEFAULT_CENTER}
      zoom={12}
      scrollWheelZoom={false} // avoids getting stuck on the map while scrolling the page
      className="h-80 w-full rounded-xl border border-brand-200"
    >
      {/* Free OpenStreetMap tiles. The attribution is required by their license. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds points={points} />

      {/* The user's position: a blue dot */}
      {userCoords && (
        <CircleMarker
          center={[userCoords.lat, userCoords.lng]}
          radius={8}
          pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
        >
          <Popup>Vous êtes ici</Popup>
        </CircleMarker>
      )}

      {/* One marker per pharmacy */}
      {pharmacies.map((pharmacy) => (
        <Marker
          key={pharmacy.id}
          position={[pharmacy.latitude, pharmacy.longitude]}
          icon={pharmacyIcon(pharmacy.status)}
        >
          <Popup>
            <strong>{pharmacy.name}</strong>
            <br />
            {STATUS[pharmacy.status]?.label}
            {pharmacy.distanceKm != null && <> - {formatDistance(pharmacy.distanceKm)}</>}
            <br />
            <a
              href={directionsUrl(pharmacy.latitude, pharmacy.longitude)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Itinéraire
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
