import { createContext, useContext, useState, useEffect, useRef } from "react";
import { lineWithPromo } from "../utils/promo";
import api from "../api/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();
const LS_KEY = "cart";

export function CartProvider({ children }) {
  const { user } = useAuth();
  const customerId = user?.id ?? user?.customerId ?? null;

  // Local cache utk offline / sebelum sync server
  const [items, setItems] = useState(() => {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  // Flag: sudah load awal dari server? (supaya tidak overwrite server dgn empty array)
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef(null);
  const lastSavedJson = useRef(null);

  // === Load dari server saat customer login / mount ===
  useEffect(() => {
    if (!customerId) {
      setHydrated(true); // anonymous: stay with localStorage
      return;
    }
    let cancelled = false;
    api.get("/customer/cart")
      .then((r) => {
        if (cancelled) return;
        try {
          const serverItems = JSON.parse(r.data?.items ?? "[]");
          if (Array.isArray(serverItems)) {
            setItems(serverItems);
            lastSavedJson.current = JSON.stringify(serverItems);
          }
        } catch (_) {}
      })
      .catch(() => {
        // gagal load (server down / offline) — keep localStorage
      })
      .finally(() => !cancelled && setHydrated(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // Refresh promos untuk semua item di cart. Promos di-snapshot saat add-to-cart
  // dan bisa stale kalau admin ubah schedule/harga setelahnya. Panggil di
  // Checkout mount supaya display discount sinkron dgn DB terkini.
  const refreshPromos = async () => {
    const ids = Array.from(new Set(items.map((i) => i.productId).filter(Boolean)));
    if (ids.length === 0) return;
    try {
      const r = await api.post("/customer/promos/bulk", { productIds: ids });
      const map = r.data || {};
      setItems((prev) =>
        prev.map((it) => {
          const fresh = map[it.productId] || map[String(it.productId)];
          if (!fresh) return it;
          return { ...it, promos: fresh };
        })
      );
    } catch (_) { /* silent — keep cached promos */ }
  };

  // === Persist ke localStorage tiap perubahan ===
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  // === Debounced sync ke server (500ms setelah perubahan) ===
  useEffect(() => {
    if (!hydrated || !customerId) return;
    const currentJson = JSON.stringify(items);
    if (currentJson === lastSavedJson.current) return; // skip no-op

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.put("/customer/cart", { items: currentJson })
        .then(() => { lastSavedJson.current = currentJson; })
        .catch(() => { /* offline → local tetap tersimpan */ });
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [items, hydrated, customerId]);

  const buildEntry = (product, qty, serials = []) => ({
    productId: product.id,
    productName: product.productName,
    productCode: product.productCode,
    unitPrice: product.salesPrice ?? 0,
    quantity: qty,
    serials,
    imageBase64: product.imageBase64,
    imageContentType: product.imageContentType,
    promos: product.promos || [],
  });

  const setQty = (product, qty) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === product.id && (!i.serials || i.serials.length === 0)
      );
      if (qty <= 0) {
        if (!existing) return prev;
        return prev.filter((i) => i !== existing);
      }
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, quantity: qty } : i));
      }
      return [...prev, buildEntry(product, qty, [])];
    });
  };

  // Sync SN keranjang ke daftar `serials` yang di-submit dari ProductDetail.
  // ProductDetail pre-fill checkbox-nya dari cart (lihat ProductDetail.jsx),
  // jadi user lihat apa yang sudah ada + bisa centang/uncheck. Submit =
  // REPLACE cart dgn exact list yg dicentang sekarang. Kalau serials kosong,
  // entry ke-remove.
  const addSerial = (product, serials) => {
    setItems((prev) => {
      const others = prev.filter(
        (i) => !(i.productId === product.id && i.serials && i.serials.length > 0)
      );
      if (!serials || serials.length === 0) return others;
      return [...others, buildEntry(product, serials.length, serials)];
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
        .filter((i) => i.serials == null || i.serials.length === 0 ? i.quantity > 0 : i.serials.length > 0)
    );
  };

  const remove = (productId) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const removeIndex = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const clear = () => {
    setItems([]);
    // Fire-and-forget server clear (debounced effect akan jalan juga, ini untuk kalau user lansung navigate)
    if (customerId) {
      api.delete("/customer/cart").catch(() => {});
      lastSavedJson.current = "[]";
    }
  };

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const promoTotal = items.reduce((sum, i) => {
    const line = lineWithPromo(i.unitPrice, i.quantity, i.promos);
    return sum + (i.unitPrice * i.quantity - line.subtotal);
  }, 0);
  const lineInfo = (item) => lineWithPromo(item.unitPrice, item.quantity, item.promos);

  return (
    <CartContext.Provider
      value={{
        items,
        setQty,
        addSerial,
        removeSerial,
        remove,
        removeIndex,
        clear,
        subtotal,
        promoTotal,
        netSubtotal: subtotal - promoTotal,
        lineInfo,
        totalItems,
        hydrated,
        refreshPromos,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
