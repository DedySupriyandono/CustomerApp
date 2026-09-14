import { createContext, useContext, useState } from "react";
import axios from "axios";

const OwnerAuthContext = createContext();

const baseURL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? "https://api-golden.modoto.net/api"
    : "https://api-golden.modoto.net/api");

// Axios instance dgn header Authorization otomatis dari localStorage.
// Dipakai semua page /owner/* yg butuh data dari API.
export const ownerApi = axios.create({ baseURL });
ownerApi.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("ownerToken");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ── Auto-refresh access token pada 401 ──
// Access token TTL default 15 menit. Tanpa refresh flow user "gampang logout".
// Pattern: 1 in-flight refreshPromise di-share supaya request concurrent tidak
// call /owner/refresh berkali-kali.
let refreshPromise = null;
function forceOwnerLogout() {
  localStorage.removeItem("ownerToken");
  localStorage.removeItem("ownerRefreshToken");
  localStorage.removeItem("ownerRefreshExpiresAt");
  localStorage.removeItem("ownerUser");
  if (!location.pathname.startsWith("/owner/login")) location.href = "/owner/login";
}
ownerApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    const status   = err.response?.status;
    if (status !== 401 || original._retriedAuth) return Promise.reject(err);

    const refreshToken = localStorage.getItem("ownerRefreshToken");
    if (!refreshToken) { forceOwnerLogout(); return Promise.reject(err); }
    if ((original.url || "").endsWith("/owner/refresh")) { forceOwnerLogout(); return Promise.reject(err); }

    original._retriedAuth = true;
    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${baseURL}/owner/refresh`, { refreshToken })
          .then((r) => {
            const d = r.data || {};
            if (!d.token) throw new Error("refresh: no token");
            localStorage.setItem("ownerToken", d.token);
            if (d.refreshToken) localStorage.setItem("ownerRefreshToken", d.refreshToken);
            if (d.refreshExpiresAt) localStorage.setItem("ownerRefreshExpiresAt", d.refreshExpiresAt);
            return d.token;
          })
          .finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return ownerApi(original);
    } catch (e) {
      forceOwnerLogout();
      return Promise.reject(err);
    }
  }
);

export function OwnerAuthProvider({ children }) {
  const [owner, setOwner] = useState(() => {
    const raw = localStorage.getItem("ownerUser");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (username, password) => {
    const { data } = await axios.post(`${baseURL}/owner/login`, { username, password });
    localStorage.setItem("ownerToken", data.token);
    if (data.refreshToken) localStorage.setItem("ownerRefreshToken", data.refreshToken);
    if (data.refreshExpiresAt) localStorage.setItem("ownerRefreshExpiresAt", data.refreshExpiresAt);
    localStorage.setItem("ownerUser", JSON.stringify(data));
    setOwner(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("ownerRefreshToken");
    localStorage.removeItem("ownerRefreshExpiresAt");
    localStorage.removeItem("ownerUser");
    setOwner(null);
  };

  return (
    <OwnerAuthContext.Provider value={{ owner, login, logout }}>
      {children}
    </OwnerAuthContext.Provider>
  );
}

export const useOwnerAuth = () => useContext(OwnerAuthContext);
