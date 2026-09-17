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
  // Termasuk juga sell cart di SalesSell (key `sales_sell_state_v1_*` +
  // `sales_sell_claims_v1_*`) — scan prefix + hapus semua, biar orphan cart
  // user lain di device sama juga bersih.
  const clearSalesCartStorage = () => {
    try {
      localStorage.removeItem("salesCart");
      localStorage.removeItem("salesCartWarehouse");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("sales_sell_state_v1_") || k.startsWith("sales_sell_claims_v1_"))) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  };

  const login = async (username, password) => {
    const { data } = await axios.post(`${baseURL}/sales/login`, { username, password });

    // Selalu clear sell cart tiap login (bahkan re-login user sama) — start
    // fresh setiap shift kerja. Sell cart tidak boleh nyangkut lintas login.
    clearSalesCartStorage();

    localStorage.setItem("salesToken", data.token);
    // Simpan refresh token — dipakai salesApi interceptor untuk auto-refresh
    // saat access token expired (default TTL 15 menit). Tanpa ini user
    // dilempar ke /sales/login tiap 15 menit walau lagi aktif.
    if (data.refreshToken) localStorage.setItem("salesRefreshToken", data.refreshToken);
    if (data.refreshExpiresAt) localStorage.setItem("salesRefreshExpiresAt", data.refreshExpiresAt);
    localStorage.setItem("salesUser", JSON.stringify(data));
    setSales(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("salesToken");
    localStorage.removeItem("salesRefreshToken");
    localStorage.removeItem("salesRefreshExpiresAt");
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
