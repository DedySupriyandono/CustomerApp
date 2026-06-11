import axios from "axios";

// Auto-resolve API URL:
// - If VITE_API_URL is set in .env, use it.
// - Otherwise, use the same hostname the PWA was loaded from + port 5015.
//   That way opening the app at http://192.167.61.17:5173 will call
//   http://192.167.61.17:5015/api — same address space, no Private Network
//   Access (PNA) block.
const resolveBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location?.hostname) {
    return "https://api-golden.modoto.net/api";
  }
  return "https://api-golden.modoto.net/api";
};

const api = axios.create({ baseURL: resolveBaseUrl() });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (location.pathname !== "/login") location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
