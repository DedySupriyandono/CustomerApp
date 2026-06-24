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

export function OwnerAuthProvider({ children }) {
  const [owner, setOwner] = useState(() => {
    const raw = localStorage.getItem("ownerUser");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (username, password) => {
    const { data } = await axios.post(`${baseURL}/owner/login`, { username, password });
    localStorage.setItem("ownerToken", data.token);
    localStorage.setItem("ownerUser", JSON.stringify(data));
    setOwner(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("ownerToken");
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
