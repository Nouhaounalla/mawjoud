"use client";

import { STATUS, STATUS_KEYS } from "@/lib/status";

// Three buttons to choose a stock status. The current status is highlighted.
//   current:  the status in the database right now (or undefined)
//   onChange: called with "in_stock" | "low" | "out" when a button is clicked
//   disabled: true while a save is in progress
export default function StatusButtons({ current, onChange, disabled = false }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STATUS_KEYS.map((key) => {
        const isCurrent = current === key;
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(key)}
            className={`rounded-lg border px-2 py-2 text-sm font-semibold transition disabled:opacity-50 ${
              isCurrent
                ? STATUS[key].active
                : "border-brand-200 bg-white text-brand-900 hover:bg-brand-50"
            }`}
          >
            {STATUS[key].label}
          </button>
        );
      })}
    </div>
  );
}
