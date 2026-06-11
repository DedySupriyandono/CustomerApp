import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import api from "../api/api";
import salesApi from "../api/salesApi";
import { playNotif } from "../utils/notifSound";

const POLL_INTERVAL = 20000; // 20s

function buildProvider(mode) {
  const ctx = createContext({ unread: 0, refetch: () => {} });

  function Provider({ children }) {
    const [unread, setUnread] = useState(0);
    const timer = useRef(null);
    const prevUnread = useRef(null); // null = first load (jangan beep)

    const fetchCount = useCallback(async () => {
      try {
        const client = mode === "sales" ? salesApi : api;
        const prefix = mode === "sales" ? "/sales" : "/customer";
        const tokenKey = mode === "sales" ? "salesToken" : "token";
        if (!localStorage.getItem(tokenKey)) return;
        const { data } = await client.get(`${prefix}/notifications/count`);
        const next = data?.unread || 0;
        // Play sound kalau unread bertambah (skip first load — prevUnread=null)
        if (prevUnread.current !== null && next > prevUnread.current) {
          playNotif();
        }
        prevUnread.current = next;
        setUnread(next);
      } catch (_) {}
    }, []);

    useEffect(() => {
      fetchCount();
      timer.current = setInterval(fetchCount, POLL_INTERVAL);
      const onVis = () => {
        if (document.visibilityState === "visible") fetchCount();
      };
      document.addEventListener("visibilitychange", onVis);
      return () => {
        clearInterval(timer.current);
        document.removeEventListener("visibilitychange", onVis);
      };
    }, [fetchCount]);

    return <ctx.Provider value={{ unread, refetch: fetchCount }}>{children}</ctx.Provider>;
  }

  return [Provider, () => useContext(ctx)];
}

export const [CustomerNotificationProvider, useCustomerNotifications] =
  buildProvider("customer");
export const [SalesNotificationProvider, useSalesNotifications] = buildProvider("sales");
