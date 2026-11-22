"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// First login: the pharmacist registers THEIR pharmacy.
// The database function register_pharmacy() creates it and links the user.
export default function RegisterPharmacy({ user, onDone }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Fill latitude/longitude with the position of the device.
  function useMyPosition() {
    setError("");
    if (!navigator.geolocation) {
      setError("La localisation n'est pas disponible sur cet appareil.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => setError("Impossible d'obtenir la position. Autorisez la localisation."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!lat || !lng || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError("Indiquez la position de la pharmacie (bouton « Utiliser ma position »).");
      return;
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError("Position invalide.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.rpc("register_pharmacy", {
      p_name: name.trim(),
      p_address: address.trim(),
      p_phone: phone.trim(),
      p_lat: latitude,
      p_lng: longitude,
    });
    setBusy(false);

    if (error) {
      console.error(error);
      setError("Enregistrement impossible : " + error.message);
      return;
    }
    onDone(); // reload: the page now shows the stock screen
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md space-y-4 rounded-2xl border border-brand-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-brand-900/70">Connecté : {user.email}</span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="shrink-0 text-brand-600 underline"
        >
          Se déconnecter
        </button>
      </div>

      <h2 className="text-xl font-bold">Enregistrer ma pharmacie</h2>
      <p className="text-sm text-brand-900/70">
        Étape unique. Votre pharmacie sera visible des patients après vérification par l&apos;équipe Mawjoud.
      </p>

      <label className="block text-sm font-medium">
        Nom de la pharmacie
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </label>
      <label className="block text-sm font-medium">
        Adresse
        <input required value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
      </label>
      <label className="block text-sm font-medium">
        Téléphone
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </label>

      <div className="space-y-2">
        <button
          type="button"
          onClick={useMyPosition}
          className="w-full rounded-lg border border-brand-600 px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-100"
        >
          Utiliser ma position (soyez dans la pharmacie)
        </button>
        <div className="flex gap-2">
          <input
            inputMode="decimal"
            placeholder="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className={inputClass}
            aria-label="Latitude"
          />
          <input
            inputMode="decimal"
            placeholder="Longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className={inputClass}
            aria-label="Longitude"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Veuillez patienter..." : "Enregistrer ma pharmacie"}
      </button>
    </form>
  );
}