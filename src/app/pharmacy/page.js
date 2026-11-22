"use client";

import { useCallback, useEffect, useState } from "react";
import AuthForm from "@/components/AuthForm";
import RegisterPharmacy from "@/components/RegisterPharmacy";
import StockManager from "@/components/StockManager";
import { supabase } from "@/lib/supabase";

// Pharmacy area: log in -> register your pharmacy (first time) -> update stock.
export default function PharmacyPage() {
  const [session, setSession] = useState(null); // logged-in session, or null
  const [ready, setReady] = useState(false); // false until we know if someone is logged in
  const [pharmacy, setPharmacy] = useState(null); // the pharmacy of this user, or null
  const [loadingPharmacy, setLoadingPharmacy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Find the pharmacy linked to the logged-in user (table pharmacy_staff).
  const loadPharmacy = useCallback(async () => {
    if (!session) {
      setPharmacy(null);
      return;
    }
    setLoadingPharmacy(true);
    const { data } = await supabase
      .from("pharmacy_staff")
      .select("pharmacies ( id, name, address, verified )")
      .limit(1)
      .maybeSingle();
    setPharmacy(data?.pharmacies ?? null);
    setLoadingPharmacy(false);
  }, [session]);

  useEffect(() => {
    loadPharmacy();
  }, [loadPharmacy]);

  return (
    <div className="space-y-6">
      <section className="text-center">
        <h1 className="text-3xl font-extrabold text-brand-900">Espace pharmacie</h1>
        <p className="mt-2 text-brand-900/70">
          Indiquez en quelques clics si un médicament est en stock.
        </p>
      </section>

      {(!ready || loadingPharmacy) && (
        <p className="text-center text-brand-900/70">Chargement...</p>
      )}
      {ready && !session && <AuthForm />}
      {ready && session && !loadingPharmacy && !pharmacy && (
        <RegisterPharmacy user={session.user} onDone={loadPharmacy} />
      )}
      {ready && session && !loadingPharmacy && pharmacy && (
        <StockManager user={session.user} pharmacy={pharmacy} />
      )}
    </div>
  );
}