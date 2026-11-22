"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import BarcodeScanner from "@/components/BarcodeScanner";
import PharmacyList from "@/components/PharmacyList";
import { getUserLocation, haversineKm } from "@/lib/geo";
import { supabase } from "@/lib/supabase";
import { useMedicationSearch } from "@/lib/useMedicationSearch";

// Leaflet needs the browser ("window"), so the map is loaded only on the client.
const PharmacyMap = dynamic(() => import("@/components/PharmacyMap"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-xl bg-brand-100" />,
});

export default function HomePage() {
  // --- State: everything that can change on the screen ---
  const search = useMedicationSearch(); // text search (query, suggestions...)
  const [scanning, setScanning] = useState(false); // is the camera open?
  const [selected, setSelected] = useState(null); // the chosen medicine
  const [pharmacies, setPharmacies] = useState([]); // pharmacies that have it
  const [userCoords, setUserCoords] = useState(null); // { lat, lng } or null
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | granted | denied | unavailable
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // info / error shown to the user

  // The position is asked only once: we keep the answer here.
  const locationRef = useRef(null);

  // --- Step 1: the user chose a medicine (from the list or by scanning) ---
  async function selectMedication(medication) {
    search.pick(medication);
    setSelected(medication);
    setScanning(false);
    setMessage("");
    setLoading(true);

    // Ask for the position (only the first time) and load the stock at the same time.
    if (!locationRef.current) {
      locationRef.current = getUserLocation();
    }
    const [location, stockResult] = await Promise.all([
      locationRef.current,
      supabase
        .from("stock")
        .select("status, updated_at, pharmacies ( id, name, address, phone, latitude, longitude )")
        .eq("medication_id", medication.id)
        .in("status", ["in_stock", "low"]), // hide pharmacies that are out of stock
    ]);

    setLocationStatus(location.status);
    setUserCoords(location.coords);
    setLoading(false);

    if (stockResult.error) {
      setPharmacies([]);
      setMessage("Une erreur est survenue en chargeant les pharmacies. Réessayez.");
      return;
    }

    // --- Step 2: compute the distance of each pharmacy and sort ---
    const list = stockResult.data
      .filter((row) => row.pharmacies) // safety: ignore rows without a pharmacy
      .map((row) => ({
        ...row.pharmacies,
        status: row.status,
        updated_at: row.updated_at,
        // distanceKm stays null when we do not know where the user is
        distanceKm: location.coords
          ? haversineKm(
              location.coords.lat,
              location.coords.lng,
              row.pharmacies.latitude,
              row.pharmacies.longitude
            )
          : null,
      }));

    if (location.coords) {
      list.sort((a, b) => a.distanceKm - b.distanceKm); // closest first
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name)); // no position: alphabetical
    }

    setPharmacies(list);
  }

  // --- Barcode scanned: find which medicine it belongs to ---
  async function handleBarcode(code) {
    setScanning(false);
    setMessage("");
    setLoading(true);

    // "medications ( ... )" asks Supabase to also return the linked medicine.
    const { data, error } = await supabase
      .from("barcodes")
      .select("medications ( id, name, dosage, form )")
      .eq("barcode", code.trim())
      .maybeSingle();

    setLoading(false);

    if (error) {
      setMessage("Une erreur est survenue pendant la recherche du code. Réessayez.");
      return;
    }
    if (!data || !data.medications) {
      setSelected(null);
      setPharmacies([]);
      setMessage(
        `Le code à barres ${code} n'est pas encore dans notre base. Essayez de rechercher le médicament par son nom.`
      );
      return;
    }

    selectMedication(data.medications);
  }

  // The text shown next to a medicine: "Doliprane 1000 mg - comprimé"
  function medicationLabel(med) {
    return [med.name, med.dosage].filter(Boolean).join(" ");
  }

  return (
    <div className="space-y-6">
      {/* ---------- Title ---------- */}
      <section className="text-center">
        <h1 className="text-3xl font-extrabold text-brand-900">
          Trouvez votre médicament près de chez vous
        </h1>
        <p className="mt-2 text-brand-900/70">
          Tapez son nom ou scannez le code à barres de la boîte.
        </p>
      </section>

      {/* ---------- Search bar + scanner button ---------- */}
      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <input
            type="search"
            value={search.query}
            onChange={(event) => search.handleChange(event.target.value)}
            placeholder="Ex : Doliprane"
            aria-label="Nom du médicament"
            className="min-w-0 flex-1 rounded-lg border border-brand-200 px-3 py-2.5 text-brand-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="button"
            onClick={() => setScanning((open) => !open)}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              scanning
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-brand-600 text-white hover:bg-brand-700"
            }`}
          >
            {scanning ? "Fermer" : "Scanner"}
          </button>
        </div>

        {/* Suggestions while typing */}
        {search.searching && <p className="mt-2 text-sm text-brand-900/60">Recherche...</p>}
        {search.suggestions.length > 0 && (
          <ul className="mt-2 divide-y divide-brand-100 overflow-hidden rounded-lg border border-brand-200">
            {search.suggestions.map((med) => (
              <li key={med.id}>
                <button
                  type="button"
                  onClick={() => selectMedication(med)}
                  className="block w-full px-3 py-2.5 text-left hover:bg-brand-50"
                >
                  <span className="font-semibold">{medicationLabel(med)}</span>
                  {med.form && <span className="text-sm text-brand-900/60"> - {med.form}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!search.searching &&
          search.query.trim().length >= 2 &&
          search.suggestions.length === 0 &&
          selected?.name !== search.query && (
            <p className="mt-2 text-sm text-brand-900/60">Aucun médicament trouvé.</p>
          )}

        {/* The camera scanner (only mounted while open, so the camera stops when closed) */}
        {scanning && (
          <div className="mt-3">
            <BarcodeScanner onDetected={handleBarcode} />
          </div>
        )}
      </section>

      {message && (
        <p className="rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900">{message}</p>
      )}

      {loading && <p className="text-center text-brand-900/70">Chargement...</p>}

      {/* ---------- Results ---------- */}
      {selected && !loading && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">{medicationLabel(selected)}</h2>
            {selected.form && <p className="text-sm text-brand-900/70">{selected.form}</p>}
          </div>

          {/* Explain why there is no distance, when location was not shared */}
          {locationStatus === "denied" && (
            <p className="rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900">
              Vous avez refusé la localisation : les pharmacies ne sont pas triées par distance.
              Autorisez-la dans votre navigateur puis relancez la recherche.
            </p>
          )}
          {locationStatus === "unavailable" && (
            <p className="rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900">
              Votre position est indisponible : les pharmacies ne sont pas triées par distance.
            </p>
          )}

          {pharmacies.length === 0 ? (
            <p className="rounded-xl border border-brand-200 bg-white p-4 text-center">
              Aucune pharmacie n&apos;a ce médicament en stock pour le moment.
            </p>
          ) : (
            <>
              <PharmacyMap pharmacies={pharmacies} userCoords={userCoords} />
              <PharmacyList pharmacies={pharmacies} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
