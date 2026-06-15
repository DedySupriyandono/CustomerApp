import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? "https://api-golden.modoto.net/api"
    : "https://api-golden.modoto.net/api");

const salesApi = axios.create({ baseURL });

salesApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("salesToken");
  // Custom scheme — backend parse prefix "G0l3d3nUat" lewat
  // JwtBearer.OnMessageReceived dan validate sisanya sebagai JWT biasa.
  if (token) config.headers.Authorization = `G0l3d3nUat ${token}`;
  return config;
});

salesApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("salesToken");
      localStorage.removeItem("salesUser");
      if (!location.pathname.startsWith("/sales/login")) location.href = "/sales/login";
    }
    return Promise.reject(err);
  }
);

export default salesApi;
