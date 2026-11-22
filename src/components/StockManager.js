"use client";

import { useCallback, useEffect, useState } from "react";
import AddMedication from "@/components/AddMedication";
import StatusBadge from "@/components/StatusBadge";
import StatusButtons from "@/components/StatusButtons";
import { timeAgo } from "@/lib/geo";
import { supabase } from "@/lib/supabase";
import { useMedicationSearch } from "@/lib/useMedicationSearch";

// The screen a logged-in pharmacist uses to update stock.
//   user: the logged-in Supabase user (we only display the e-mail)
//   pharmacy: the pharmacy of this user { id, name, address, verified }
export default function StockManager({ user, pharmacy }) {
  const search = useMedicationSearch();

  const pharmacyId = String(pharmacy.id); // a pharmacist only manages their own pharmacy
  const [stockRows, setStockRows] = useState([]); // current stock of that pharmacy
  const [selectedMed, setSelectedMed] = useState(null); // medicine being edited
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load the stock of the chosen pharmacy (called again after each update).
  const loadStock = useCallback(async () => {
    if (!pharmacyId) return;

    const { data, error } = await supabase
      .from("stock")
      .select("id, status, updated_at, medications ( id, name, dosage, form )")
      .eq("pharmacy_id", pharmacyId)
      .order("updated_at", { ascending: false });

    if (error) {
      setMessage({ type: "error", text: "Impossible de charger le stock." });
      return;
    }
    setStockRows(data);
  }, [pharmacyId]);

  // Reload the stock whenever the pharmacy changes.
  useEffect(() => {
    setStockRows([]);
    setSelectedMed(null);
    loadStock();
  }, [loadStock]);

  // Save a new status for one medicine in the chosen pharmacy.
  async function updateStatus(medicationId, status) {
    setSaving(true);
    setMessage({ type: "", text: "" });

    // "upsert" = update the row if it exists, otherwise create it.
    // onConflict matches the unique (pharmacy_id, medication_id) rule in the database.
    // updated_at is refreshed automatically by the database.
    const { error } = await supabase
      .from("stock")
      .upsert(
        { pharmacy_id: Number(pharmacyId), medication_id: medicationId, status },
        { onConflict: "pharmacy_id,medication_id" }
      );

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Mise à jour impossible. Vérifiez que vous êtes connecté et que le fichier schema.sql a bien été exécuté.",
      });
      return;
    }

    setMessage({ type: "success", text: "Stock mis à jour." });
    await loadStock();
  }

  // Current status of the medicine being edited (undefined if never set).
  const currentStatus = selectedMed
    ? stockRows.find((row) => row.medications?.id === selectedMed.id)?.status
    : undefined;

  function medicationLabel(med) {
    return [med.name, med.dosage].filter(Boolean).join(" ");
  }

  return (
    <div className="space-y-6">
      {/* ---------- Who is logged in ---------- */}
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-brand-900/70">Connecté : {user.email}</span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="shrink-0 rounded-lg border border-brand-600 px-3 py-1.5 font-semibold text-brand-600 hover:bg-brand-100"
        >
          Se déconnecter
        </button>
      </div>

      {/* ---------- 1. Your pharmacy ---------- */}
      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold">Votre pharmacie</p>
        <p className="mt-1 text-lg font-bold">{pharmacy.name}</p>
        {pharmacy.address && <p className="text-sm text-brand-900/70">{pharmacy.address}</p>}
        {!pharmacy.verified && (
          <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
            En attente de vérification : votre pharmacie n&apos;est pas encore visible des patients.
          </p>
        )}
      </section>

      {/* ---------- 2. Pick a medicine and set its status ---------- */}
      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <label className="block text-sm font-semibold" htmlFor="stock-search">
          2. Médicament à mettre à jour
        </label>
        <input
          id="stock-search"
          type="search"
          value={search.query}
          onChange={(event) => {
            search.handleChange(event.target.value);
            setSelectedMed(null);
          }}
          placeholder="Ex : Doliprane"
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        />

        {search.suggestions.length > 0 && (
          <ul className="mt-2 divide-y divide-brand-100 overflow-hidden rounded-lg border border-brand-200">
            {search.suggestions.map((med) => (
              <li key={med.id}>
                <button
                  type="button"
                  onClick={() => {
                    search.pick(med);
                    setSelectedMed(med);
                  }}
                  className="block w-full px-3 py-2.5 text-left hover:bg-brand-50"
                >
                  {medicationLabel(med)}
                  {med.form && <span className="text-sm text-brand-900/60"> - {med.form}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedMed && (
          <div className="mt-4 space-y-3">
            <p className="font-semibold">
              {medicationLabel(selectedMed)}{" "}
              {currentStatus ? (
                <StatusBadge status={currentStatus} />
              ) : (
                <span className="text-sm font-normal text-brand-900/60">(pas encore renseigné)</span>
              )}
            </p>
            <StatusButtons
              current={currentStatus}
              disabled={saving}
              onChange={(status) => updateStatus(selectedMed.id, status)}
            />
          </div>
        )}

        {message.text && (
          <p
            className={`mt-3 text-sm ${
              message.type === "error" ? "text-red-700" : "text-brand-700"
            }`}
          >
            {message.text}
          </p>
        )}
      </section>

      <AddMedication
        onAdded={(med) => {
          search.pick(med);
          setSelectedMed(med);
        }}
      />

      {/* ---------- 3. Current stock of this pharmacy ---------- */}
      <section>
        <h2 className="mb-2 text-lg font-bold">Stock actuel de cette pharmacie</h2>

        {stockRows.length === 0 ? (
          <p className="rounded-xl border border-brand-200 bg-white p-4 text-sm text-brand-900/70">
            Aucun médicament renseigné pour le moment. Recherchez-en un ci-dessus.
          </p>
        ) : (
          <ul className="space-y-3">
            {stockRows.map((row) => (
              <li key={row.id} className="rounded-xl border border-brand-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{medicationLabel(row.medications)}</span>
                  <span className="text-sm text-brand-900/60">
                    Mis à jour {timeAgo(row.updated_at)}
                  </span>
                </div>
                <StatusButtons
                  current={row.status}
                  disabled={saving}
                  onChange={(status) => updateStatus(row.medications.id, status)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}