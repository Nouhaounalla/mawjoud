import { STATUS } from "@/lib/status";

// Small colored pill: "En stock", "Stock faible" or "Rupture".
export default function StatusBadge({ status }) {
  const info = STATUS[status];
  if (!info) return null;

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.badge}`}>
      {info.label}
    </span>
  );
}
