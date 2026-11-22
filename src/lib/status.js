// The three possible stock statuses, with their label and colors.
// The keys (in_stock / low / out) must match the values stored in the database.

export const STATUS = {
  in_stock: {
    label: "En stock",
    badge: "bg-brand-100 text-brand-700",
    active: "bg-brand-600 text-white border-brand-600",
  },
  low: {
    label: "Stock faible",
    badge: "bg-amber-100 text-amber-800",
    active: "bg-amber-500 text-white border-amber-500",
  },
  out: {
    label: "Rupture",
    badge: "bg-red-100 text-red-700",
    active: "bg-red-600 text-white border-red-600",
  },
};

// Order used for the buttons.
export const STATUS_KEYS = ["in_stock", "low", "out"];
