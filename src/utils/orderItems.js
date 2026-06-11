// Group order items by (productName + unitPrice). When multiple rows fall
// into the same group (e.g. Kartu Perdana with 1 row per SN), the group is
// flagged as `isGrouped` so the UI can render an accordion.
export function groupOrderItems(items) {
  const map = new Map();
  for (const item of items || []) {
    const key = `${item.productName}__${item.unitPrice}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        productName: item.productName,
        unitPrice: item.unitPrice,
        rows: [],
      });
    }
    map.get(key).rows.push(item);
  }
  return Array.from(map.values()).map((g) => ({
    ...g,
    categoryName: g.rows[0]?.categoryName ?? null,
    totalQuantity: g.rows.reduce((s, r) => s + r.quantity, 0),
    totalSubtotal: g.rows.reduce((s, r) => s + r.subtotal, 0),
    totalDiscount: g.rows.reduce((s, r) => s + (Number(r.discount) || 0), 0),
    isGrouped: g.rows.length > 1,
  }));
}

// Apakah category termasuk voucher (kode rahasia sebelum delivery)
export function isVoucherCategory(categoryName) {
  if (!categoryName) return false;
  const lc = String(categoryName).toLowerCase();
  return lc.includes("voucer") || lc.includes("voucher");
}
