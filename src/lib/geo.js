// Small helpers for distance, location, time and directions.

/**
 * Haversine formula: straight-line distance in kilometers between two
 * GPS points (latitude/longitude in degrees).
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_KM = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** 0.45 -> "450 m", 3.27 -> "3.3 km" */
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Asks the browser for the user's position (the browser shows a
 * permission pop-up). It never throws: it always resolves with
 *   { status: "granted", coords: { lat, lng } }
 *   { status: "denied" | "unavailable", coords: null }
 */
export function getUserLocation() {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ status: "unavailable", coords: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          status: "granted",
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
        }),
      (error) =>
        resolve({
          // error.code 1 means the user refused the permission
          status: error.code === 1 ? "denied" : "unavailable",
          coords: null,
        }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/** "il y a 12 min", "il y a 3 h", "il y a 2 j" ... */
export function timeAgo(isoDate) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 1000));
  if (seconds < 60) return "à l'instant";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

/** True when the information is more than 24 hours old. */
export function isStale(isoDate) {
  return Date.now() - new Date(isoDate).getTime() > 24 * 60 * 60 * 1000;
}

/** Opens Google Maps with turn-by-turn directions. Free, no API key needed. */
export function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
