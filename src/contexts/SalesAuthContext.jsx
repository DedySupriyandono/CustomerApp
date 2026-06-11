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

  const login = async (username, password) => {
    const { data } = await axios.post(`${baseURL}/sales/login`, { username, password });
    localStorage.setItem("salesToken", data.token);
    localStorage.setItem("salesUser", JSON.stringify(data));
    setSales(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("salesToken");
    localStorage.removeItem("salesUser");
    setSales(null);
  };

  return (
    <SalesAuthContext.Provider value={{ sales, login, logout }}>
      {children}
    </SalesAuthContext.Provider>
  );
}

export const useSalesAuth = () => useContext(SalesAuthContext);
