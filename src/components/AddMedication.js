"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Lets a pharmacist add a medicine (and its barcode) that is not in the database yet.
//   onAdded(medication): called with the new (or already existing) medicine
export default function AddMedication({ onAdded }) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [form, setForm] = useState("");
  const [barcode, setBarcode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    const code = barcode.replace(/\s+/g, "");
    if (code && !/^\d{6,14}$/.test(code)) {
      setMessage({ type: "error", text: "Le code à barres doit contenir 6 à 14 chiffres." });
      return;
    }

    setBusy(true);

    // 1. If this barcode already exists, reuse that medicine (no duplicate).
    if (code) {
      const { data: existing } = await supabase
        .from("barcodes")
        .select("medications ( id, name, dosage, form )")
        .eq("barcode", code)
        .maybeSingle();

      if (existing?.medications) {
        setBusy(false);
        setMessage({ type: "success", text: "Ce médicament existe déjà : sélectionné." });
        onAdded(existing.medications);
        return;
      }
    }

    // 2. Create the medicine.
    const { data: med, error: medError } = await supabase
      .from("medications")
      .insert({
        name: name.trim(),
        dosage: dosage.trim() || null,
        form: form.trim() || null,
      })
      .select("id, name, dosage, form")
      .single();

    if (medError) {
      console.error(medError);
      setBusy(false);
      setMessage({ type: "error", text: "Ajout impossible : " + medError.message });
      return;
    }

    // 3. Attach the barcode (optional).
    if (code) {
      const { error: codeError } = await supabase
        .from("barcodes")
        .insert({ barcode: code, medication_id: med.id });
      if (codeError) {
        console.error(codeError);
        setMessage({
          type: "error",
          text: "Médicament ajouté, mais le code à barres a échoué : " + codeError.message,
        });
      } else {
        setMessage({ type: "success", text: "Médicament ajouté." });
      }
    } else {
      setMessage({ type: "success", text: "Médicament ajouté." });
    }

    setBusy(false);
    setName("");
    setDosage("");
    setForm("");
    setBarcode("");
    onAdded(med);
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200";

  return (
    <details className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold">
        Médicament introuvable ? Ajoutez-le
      </summary>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <label className="block text-sm font-medium">
          Nom
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <div className="flex gap-2">
          <label className="block flex-1 text-sm font-medium">
            Dosage
            <input
              placeholder="400 mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block flex-1 text-sm font-medium">
            Forme
            <input
              placeholder="comprimé"
              value={form}
              onChange={(e) => setForm(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Code à barres (chiffres sous les barres)
          <input
            inputMode="numeric"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className={inputClass}
          />
        </label>

        {message.text && (
          <p className={`text-sm ${message.type === "error" ? "text-red-700" : "text-brand-700"}`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Veuillez patienter..." : "Ajouter le médicament"}
        </button>
      </form>
    </details>
  );
}