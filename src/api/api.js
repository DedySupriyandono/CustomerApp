import axios from "axios";

// Auto-resolve API URL:
// - If VITE_API_URL is set in .env, use it.
// - Otherwise, use the same hostname the PWA was loaded from + port 5015.
//   That way opening the app at http://192.167.61.17:5173 will call
//   http://192.167.61.17:5015/api — same address space, no Private Network
//   Access (PNA) block.
const resolveBaseUrl = () => {
  if (
    import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location ?.hostname) {
    return "https://api-golden.modoto.net/api";
  }
  return "https://api-golden.modoto.net/api";
};

const baseURL = resolveBaseUrl();
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  // Custom scheme — backend parse prefix "G0l3d3nUat" lewat
  // JwtBearer.OnMessageReceived dan validate sisanya sebagai JWT biasa.
  if (token) config.headers.Authorization = `G0l3d3nUat ${token}`;
  return config;
});

// ── Auto-refresh access token pada 401 ──
// Access token TTL default 15 menit. Tanpa refresh flow, user "gampang logout".
// Backend endpoint: POST /customer/refresh dgn body { refreshToken }.
// Concurrent-safe: 1 in-flight promise, sisanya menunggu.
let refreshPromise = null;
function forceCustomerLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("refreshExpiresAt");
  localStorage.removeItem("user");
  if (location.pathname !== "/login") location.href = "/login";
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    const status   = err.response?.status;
    if (status !== 401 || original._retriedAuth) return Promise.reject(err);

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) { forceCustomerLogout(); return Promise.reject(err); }
    if ((original.url || "").endsWith("/customer/refresh")) { forceCustomerLogout(); return Promise.reject(err); }

    original._retriedAuth = true;
    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${baseURL}/customer/refresh`, { refreshToken })
          .then((r) => {
            const d = r.data || {};
            if (!d.token) throw new Error("refresh: no token");
            localStorage.setItem("token", d.token);
            if (d.refreshToken) localStorage.setItem("refreshToken", d.refreshToken);
            if (d.refreshExpiresAt) localStorage.setItem("refreshExpiresAt", d.refreshExpiresAt);
            return d.token;
          })
          .finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;
      original.headers = original.headers || {};
      original.headers.Authorization = `G0l3d3nUat ${newToken}`;
      return api(original);
    } catch (e) {
      forceCustomerLogout();
      return Promise.reject(err);
    }
  }
);

export default api;
