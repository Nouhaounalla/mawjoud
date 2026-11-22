"use client";

import { useEffect, useState } from "react";
import AuthForm from "@/components/AuthForm";
import StockManager from "@/components/StockManager";
import { supabase } from "@/lib/supabase";

// Pharmacy area: log in first, then update stock.
export default function PharmacyPage() {
  const [session, setSession] = useState(null); // the logged-in session, or null
  const [ready, setReady] = useState(false); // false until we know if someone is logged in

  useEffect(() => {
    // 1. Is someone already logged in (from a previous visit)?
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    // 2. Be notified when the user logs in or out.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <section className="text-center">
        <h1 className="text-3xl font-extrabold text-brand-900">Espace pharmacie</h1>
        <p className="mt-2 text-brand-900/70">
          Indiquez en quelques clics si un médicament est en stock.
        </p>
      </section>

      {!ready && <p className="text-center text-brand-900/70">Chargement...</p>}
      {ready && !session && <AuthForm />}
      {ready && session && <StockManager user={session.user} />}
    </div>
  );
}
