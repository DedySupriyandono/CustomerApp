import { createContext, useContext, useState, useEffect } from "react";
import { lineWithPromo } from "../utils/promo";

const SalesCartContext = createContext();

export function SalesCartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const raw = localStorage.getItem("salesCart");
    return raw ? JSON.parse(raw) : [];
  });

  // Warehouse yang dipilih sales utk order ini. 1 order = 1 gudang.
  // Disimpan ke localStorage supaya tetap konsisten kalau page refresh.
  const [warehouse, setWarehouseState] = useState(() => {
    const raw = localStorage.getItem("salesCartWarehouse");
    return raw ? JSON.parse(raw) : null; // { id, name }
  });

  useEffect(() => {
    localStorage.setItem("salesCart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (warehouse) localStorage.setItem("salesCartWarehouse", JSON.stringify(warehouse));
    else localStorage.removeItem("salesCartWarehouse");
  }, [warehouse]);

  // Set warehouse — kalau ganti dari yang lain, panggil clear() dulu di caller
  // (UI tampilkan konfirmasi). Tidak otomatis clear di sini supaya state cart
  // hanya hilang setelah user sadar (Swal confirm di SalesOrderProducts).
  const setWarehouse = (wh) => setWarehouseState(wh);

  const buildEntry = (p, qty, serials = []) => ({
    productId: p.id,
    productName: p.productName,
    productCode: p.productCode,
    unitPrice: p.salesPrice ?? 0,
    quantity: qty,
    serials,
    imageBase64: p.imageBase64,
    imageContentType: p.imageContentType,
    promos: p.promos || [],
  });

  const setQty = (p, qty) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === p.id && (!i.serials || i.serials.length === 0)
      );
      if (qty <= 0) return existing ? prev.filter((i) => i !== existing) : prev;
      if (existing) return prev.map((i) => (i === existing ? { ...i, quantity: qty } : i));
      return [...prev, buildEntry(p, qty, [])];
    });
  };

  // Merge SN baru ke entry existing (dedup), bukan replace.
  const addSerial = (p, serials) => {
    setItems((prev) => {
      if (!serials || serials.length === 0) return prev;
      const idx = prev.findIndex(
        (i) => i.productId === p.id && i.serials && i.serials.length > 0
      );
      if (idx >= 0) {
        const existing = prev[idx];
        const existingSet = new Set(existing.serials);
        const merged = [...existing.serials, ...serials.filter((s) => !existingSet.has(s))];
        const next = [...prev];
        next[idx] = { ...existing, serials: merged, quantity: merged.length };
        return next;
      }
      return [...prev, buildEntry(p, serials.length, serials)];
    });
  };

  const removeSerial = (productId, serial) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId || !i.serials?.length) return i;
          const next = i.serials.filter((s) => s !== serial);
          return { ...i, serials: next, quantity: next.length };
        })
        .filter((i) =>
          i.serials == null || i.serials.length === 0 ? i.quantity > 0 : i.serials.length > 0
        )
    );
  };

  const remove = (productId) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  const clear = () => setItems([]);
  // Reset penuh: cart + warehouse selection. Dipakai setelah submit order.
  const clearAll = () => { setItems([]); setWarehouseState(null); };
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const promoTotal = items.reduce((sum, i) => {
    const line = lineWithPromo(i.unitPrice, i.quantity, i.promos);
    return sum + (i.unitPrice * i.quantity - line.subtotal);
  }, 0);
  const lineInfo = (item) => lineWithPromo(item.unitPrice, item.quantity, item.promos);

  return (
    <SalesCartContext.Provider
      value={{
        items, setQty, addSerial, removeSerial, remove, clear, clearAll,
        subtotal, totalItems, promoTotal,
        netSubtotal: subtotal - promoTotal, lineInfo,
        warehouse, setWarehouse,
      }}
    >
      {children}
    </SalesCartContext.Provider>
  );
}

export const useSalesCart = () => useContext(SalesCartContext);
