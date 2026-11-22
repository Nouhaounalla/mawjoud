"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Email + password form to log in or create an account (Supabase Auth).
export default function AuthForm() {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(event) {
    event.preventDefault(); // do not reload the page
    setBusy(true);
    setError("");
    setInfo("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Connexion impossible : e-mail ou mot de passe incorrect.");
      // On success, the parent page notices the new session by itself.
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (!data.session) {
        // Supabase sends a confirmation e-mail by default.
        setInfo("Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
      }
    }

    setBusy(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-sm space-y-4 rounded-2xl border border-brand-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold">
        {mode === "login" ? "Connexion pharmacie" : "Créer un compte"}
      </h2>

      <label className="block text-sm font-medium">
        E-mail
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        />
      </label>

      <label className="block text-sm font-medium">
        Mot de passe
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        />
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {info && <p className="text-sm text-brand-700">{info}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Veuillez patienter..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError("");
          setInfo("");
        }}
        className="w-full text-sm text-brand-600 underline"
      >
        {mode === "login" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
      </button>
    </form>
  );
}
