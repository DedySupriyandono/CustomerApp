// Mirror of backend PromoResolver — picks the best applicable promo for a
// given quantity and computes per-unit discount on the client. Used to show
// the user a live simulation of their cart total before submitting; the
// backend re-computes authoritatively at order creation.

export function pickPromo(promos, quantity) {
  if (!Array.isArray(promos) || promos.length === 0) return null;
  if (quantity <= 0) return null;

  // Promos are returned sorted by priority/sequance desc.
  const match = promos.find((p) => {
    const min = p.minQuantity ?? p.MinQuantity ?? 0;
    const max = p.maxQuantity ?? p.MaxQuantity ?? null;
    if (quantity < min) return false;
    if (max != null && quantity > max) return false;
    const val = p.discountValue ?? p.DiscountValue ?? 0;
    return val > 0;
  });
  return match || null;
}

export function discountPerUnit(promo, basePrice) {
  if (!promo) return 0;
  const type = promo.discountType ?? promo.DiscountType ?? "";
  const val = promo.discountValue ?? promo.DiscountValue ?? 0;
  if (type.toLowerCase() === "cash") return val;
  // Default: percentage
  return Math.round((basePrice * val) / 100);
}

export function promoLabel(promo) {
  if (!promo) return "";
  const type = promo.discountType ?? promo.DiscountType ?? "";
  const val = promo.discountValue ?? promo.DiscountValue ?? 0;
  if (type.toLowerCase() === "cash") {
    return `Potongan Rp ${Number(val).toLocaleString("id-ID")}`;
  }
  return `Diskon ${val}%`;
}

// All promos that DO apply at current qty, ordered as backend returned.
// Plus the "next" promo (one with a higher minQuantity that you'd unlock).
export function describePromos(promos, quantity) {
  if (!Array.isArray(promos)) return { active: null, next: null, all: [] };
  const sorted = [...promos];
  const active = pickPromo(sorted, quantity);
  // Find next-tier — lowest minQuantity that's still above current qty.
  const upcoming = sorted
    .filter((p) => {
      const min = p.minQuantity ?? p.MinQuantity ?? 0;
      return min > quantity;
    })
    .sort(
      (a, b) =>
        (a.minQuantity ?? a.MinQuantity ?? 0) - (b.minQuantity ?? b.MinQuantity ?? 0)
    )[0];
  return { active, next: upcoming || null, all: sorted };
}

// Convenience: compute line subtotal given quantity, basePrice and promos[].
export function lineWithPromo(basePrice, quantity, promos) {
  const promo = pickPromo(promos, quantity);
  const dpu = discountPerUnit(promo, basePrice);
  const unitEffective = Math.max(0, basePrice - dpu);
  return {
    promo,
    discountPerUnit: dpu,
    subtotal: unitEffective * quantity,
    label: promo ? promoLabel(promo) : "",
  };
}
