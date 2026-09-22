import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ?
    "https://dev-api-golden.modoto.net/api" :
    "https://dev-api-golden.modoto.net/api");

const salesApi = axios.create({ baseURL });

salesApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("salesToken");
  // Custom scheme — backend parse prefix "G0l3d3nUat" lewat
  // JwtBearer.OnMessageReceived dan validate sisanya sebagai JWT biasa.
  if (token) config.headers.Authorization = `G0l3d3nUat ${token}`;
  return config;
});

// ── Auto-refresh access token pada 401 ──
// Sebelumnya: 401 langsung redirect ke /sales/login → user "gampang logout"
// tiap ~15 menit (access token TTL default). Sekarang: coba /sales/refresh
// pakai salesRefreshToken; kalau sukses replace token + retry request asli.
// Kalau refresh gagal (token invalid/revoked) → baru clear + redirect.
//
// Concurrent-safe: banyak request bareng expire → hanya 1 call refresh
// (refreshPromise di-share), sisanya menunggu hasilnya lalu retry.
let refreshPromise = null;
function forceLogout() {
  localStorage.removeItem("salesToken");
  localStorage.removeItem("salesRefreshToken");
  localStorage.removeItem("salesRefreshExpiresAt");
  localStorage.removeItem("salesUser");
  if (!location.pathname.startsWith("/sales/login")) location.href = "/sales/login";
}

salesApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    const status   = err.response?.status;

    // Non-401 atau sudah retry sekali → biarkan gagal.
    if (status !== 401 || original._retriedAuth) return Promise.reject(err);

    const refreshToken = localStorage.getItem("salesRefreshToken");
    if (!refreshToken) { forceLogout(); return Promise.reject(err); }

    // Jangan loop di /sales/refresh sendiri.
    if ((original.url || "").endsWith("/sales/refresh")) { forceLogout(); return Promise.reject(err); }

    original._retriedAuth = true;
    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${baseURL}/sales/refresh`, { refreshToken })
          .then((r) => {
            const d = r.data || {};
            if (!d.token) throw new Error("refresh: no token in response");
            localStorage.setItem("salesToken", d.token);
            if (d.refreshToken) localStorage.setItem("salesRefreshToken", d.refreshToken);
            if (d.refreshExpiresAt) localStorage.setItem("salesRefreshExpiresAt", d.refreshExpiresAt);
            return d.token;
          })
          .finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;
      original.headers = original.headers || {};
      original.headers.Authorization = `G0l3d3nUat ${newToken}`;
      return salesApi(original);
    } catch (e) {
      forceLogout();
      return Promise.reject(err);
    }
  }
);

export default salesApi;
