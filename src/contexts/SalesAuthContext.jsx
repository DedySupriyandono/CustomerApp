import { createContext, useContext, useState } from "react";
import axios from "axios";

const SalesAuthContext = createContext();

// Build base URL from window.location (same logic as api.js) so sales API
// is reached at the same host as the PWA.
const baseURL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? "https://api-golden.modoto.net/api"
    : "https://api-golden.modoto.net/api");

export function SalesAuthProvider({ children }) {
  const [sales, setSales] = useState(() => {
    const raw = localStorage.getItem("salesUser");
    return raw ? JSON.parse(raw) : null;
  });

  // Cart/warehouse selection di SalesCartContext disimpan di localStorage
  // — kalau user berubah (ganti login), state lama harus dibersihkan supaya
  // tidak "stuck" pakai warehouse / cart milik user sebelumnya.
  const clearSalesCartStorage = () => {
    try {
      localStorage.removeItem("salesCart");
      localStorage.removeItem("salesCartWarehouse");
    } catch {}
  };

  const login = async (username, password) => {
    const { data } = await axios.post(`${baseURL}/sales/login`, { username, password });

    // Deteksi ganti user. Bandingkan sales.id sebelum overwrite — beda user
    // → wajib clear cart + warehouse selection.
    let prevId = null;
    try {
      const prevRaw = localStorage.getItem("salesUser");
      if (prevRaw) prevId = JSON.parse(prevRaw)?.id ?? null;
    } catch {}
    if (prevId != null && prevId !== data?.id) clearSalesCartStorage();

    localStorage.setItem("salesToken", data.token);
    localStorage.setItem("salesUser", JSON.stringify(data));
    setSales(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("salesToken");
    localStorage.removeItem("salesUser");
    clearSalesCartStorage();
    setSales(null);
  };

  return (
    <SalesAuthContext.Provider value={{ sales, login, logout }}>
      {children}
    </SalesAuthContext.Provider>
  );
}

export const useSalesAuth = () => useContext(SalesAuthContext);
