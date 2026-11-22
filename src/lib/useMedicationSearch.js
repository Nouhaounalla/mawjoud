"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * A small custom hook that handles "search a medicine by name":
 * - it waits 300 ms after the last keystroke before asking the database
 * - it ignores answers that arrive too late (when the user kept typing)
 *
 * It is used by both the home page and the pharmacy stock page.
 */
export function useMedicationSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const timerRef = useRef(null);
  const requestIdRef = useRef(0); // used to detect outdated answers

  // Stop any pending timer when the component disappears.
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  // Called on every keystroke in the search input.
  function handleChange(value) {
    setQuery(value);
    clearTimeout(timerRef.current);

    // Too short: nothing to search yet.
    if (value.trim().length < 2) {
      requestIdRef.current += 1;
      setSuggestions([]);
      setSearching(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      requestIdRef.current += 1;
      const thisRequest = requestIdRef.current;
      setSearching(true);

      // ilike = case-insensitive "contains"
      const { data, error } = await supabase
        .from("medications")
        .select("id, name, dosage, form")
        .ilike("name", `%${value.trim()}%`)
        .order("name")
        .limit(10);

      // A newer search started meanwhile: ignore this answer.
      if (thisRequest !== requestIdRef.current) return;

      setSearching(false);
      setSuggestions(error ? [] : data);
    }, 300);
  }

  // Called when the user picks a medicine from the list (or after a scan).
  function pick(medication) {
    requestIdRef.current += 1;
    clearTimeout(timerRef.current);
    setQuery(medication.name);
    setSuggestions([]);
    setSearching(false);
  }

  // Empties the search box.
  function reset() {
    requestIdRef.current += 1;
    clearTimeout(timerRef.current);
    setQuery("");
    setSuggestions([]);
    setSearching(false);
  }

  return { query, suggestions, searching, handleChange, pick, reset };
}
