import StatusBadge from "@/components/StatusBadge";
import { directionsUrl, formatDistance, isStale, timeAgo } from "@/lib/geo";

// The list of pharmacies, already sorted from closest to farthest.
//   pharmacies: [{ id, name, address, phone, latitude, longitude, status, updated_at, distanceKm }]
export default function PharmacyList({ pharmacies }) {
  return (
    <ul className="space-y-3">
      {pharmacies.map((pharmacy, index) => (
        <li key={pharmacy.id} className="rounded-xl border border-brand-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-brand-900">
                {/* The first one is the closest, highlight it */}
                {index === 0 && pharmacy.distanceKm != null && (
                  <span className="mr-2 rounded bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                    La plus proche
                  </span>
                )}
                {pharmacy.name}
              </h3>
              {pharmacy.address && (
                <p className="text-sm text-brand-900/70">{pharmacy.address}</p>
              )}
            </div>

            {pharmacy.distanceKm != null && (
              <span className="shrink-0 text-lg font-bold text-brand-600">
                {formatDistance(pharmacy.distanceKm)}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={pharmacy.status} />
            <span className={isStale(pharmacy.updated_at) ? "text-amber-700" : "text-brand-900/70"}>
              Mis à jour {timeAgo(pharmacy.updated_at)}
              {isStale(pharmacy.updated_at) && " (information ancienne)"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {/* Opens Google Maps with directions to this pharmacy */}
            <a
              href={directionsUrl(pharmacy.latitude, pharmacy.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Itinéraire
            </a>

            {pharmacy.phone && (
              <a
                href={`tel:${pharmacy.phone.replace(/\s/g, "")}`}
                className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
              >
                Appeler
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
