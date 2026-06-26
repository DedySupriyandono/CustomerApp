import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, X, Check, CheckCheck } from "lucide-react";
import api from "../api/api";
import salesApi from "../api/salesApi";
import { playChat } from "../utils/notifSound";

const POLL_INTERVAL = 3000; // 3s while open

// Status yg menutup chat — pesan masih bisa dilihat (read-only), tapi
// tidak bisa kirim baru. Sinkron dgn aturan di web (SalesOrder/Edit).
const CHAT_LOCKED_STATUSES = new Set([
  "Selesai", "Selesai Sebagian",
  "Dibatalkan",
  "Completed", "Cancelled", "Deleted",
]);

/**
 * Floating chat for a given order.
 * Props:
 *  - orderId
 *  - mode: "customer" | "sales"
 *  - currentUserType: "customer" | "sales" (drives bubble alignment)
 *  - orderStatus: kalau salah satu dari CHAT_LOCKED_STATUSES, input disabled
 *    dan banner ditampilkan. History tetap bisa di-scroll.
 */
export default function OrderChat({ orderId, mode = "customer", currentUserType, orderStatus }) {
  const chatLocked = CHAT_LOCKED_STATUSES.has(String(orderStatus || ""));
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const since = useRef(null);
  const timer = useRef(null);
  const bottom = useRef(null);

  const client = mode === "sales" ? salesApi : api;
  const prefix = mode === "sales" ? "/sales" : "/customer";

  const meType = currentUserType || (mode === "sales" ? "sales" : "customer");

  const fetchMessages = async (incremental = true) => {
    try {
      const params = incremental && since.current ? { since: since.current } : {};
      const { data } = await client.get(`${prefix}/orders/${orderId}/messages`, { params });
      if (!Array.isArray(data)) return;
      if (data.length === 0) return;
      // Track the max of (createdAt, readAt) so we don't re-fetch the same
      // messages every poll once their read_at has been synced.
      for (const m of data) {
        if (m.createdAt && (!since.current || m.createdAt > since.current))
          since.current = m.createdAt;
        if (m.readAt && (!since.current || m.readAt > since.current))
          since.current = m.readAt;
      }

      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        // Detect benar2 message baru (id belum ada) dari pihak lain → play chat sound
        if (incremental) {
          const incomingNew = data.some(m => !map.has(m.id) && m.senderType !== meType);
          if (incomingNew) playChat();
        }
        for (const m of data) map.set(m.id, m);
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
    } catch (_) {}
  };

  useEffect(() => {
    if (!open) return;
    fetchMessages(false); // initial fetch — full
    timer.current = setInterval(() => fetchMessages(true), POLL_INTERVAL);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  useEffect(() => {
    if (open) bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    if (chatLocked) return; // defensive — UI sudah disable, ini double-guard.
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { data } = await client.post(`${prefix}/orders/${orderId}/messages`, { body });
      setDraft("");
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        return exists ? prev : [...prev, data];
      });
      if (data?.createdAt) since.current = data.createdAt;
    } catch (e) {
      console.error("[OrderChat] send error:", e.response?.data || e);
      const data = e.response?.data || {};
      const msg = data.message || data.title || e.message || "Gagal kirim pesan";
      const detail = data.detail ? `\nDetail: ${data.detail}` : "";
      alert(`Error: ${msg}${detail}\nStatus: ${e.response?.status || "—"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 sm:right-[max(1rem,calc(50%-210px+1rem))] w-14 h-14 rounded-full bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white shadow-lg shadow-red-900/30 flex items-center justify-center z-30"
        aria-label="Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] bg-white rounded-t-3xl shadow-2xl flex flex-col"
            style={{ height: "80vh", fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F6F3F3]">
              <div>
                <h2 className="font-bold text-[16px] text-[#1A0000]">Chat Pesanan</h2>
                <p className="text-[11px] text-[#606060]">Order #{orderId}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full bg-[#FFF5F5] text-[#B20605] flex items-center justify-center"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 bg-[#FBF9F9]">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-12">
                  Belum ada pesan. Mulai percakapan!
                </div>
              )}
              {messages.map((m) => {
                if (m.senderType === "system") {
                  return (
                    <div key={m.id} className="flex justify-center my-3">
                      <div className="max-w-[85%] bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2 text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">
                          {m.senderName || "Riwayat Order"}
                        </div>
                        <div className="text-[12px] whitespace-pre-wrap break-words text-left">{m.body}</div>
                        <div className="text-[9px] text-amber-600 mt-1">
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleString("id-ID", {
                                day: "2-digit", month: "short",
                                hour: "2-digit", minute: "2-digit",
                              })
                            : ""}
                        </div>
                      </div>
                    </div>
                  );
                }
                const mine = m.senderType === meType;
                return (
                  <div
                    key={m.id}
                    className={`flex mb-2 ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                        mine
                          ? "bg-[#B20605] text-white rounded-br-md"
                          : "bg-white border border-[#F6F3F3] text-[#1A0000] rounded-bl-md"
                      }`}
                    >
                      {!mine && (
                        <div className="text-[10px] font-semibold text-[#B20605] mb-0.5">
                          {m.senderName || senderLabel(m.senderType)}
                        </div>
                      )}
                      <div className="text-[13px] whitespace-pre-wrap break-words">{m.body}</div>
                      <div className={`text-[9px] mt-1 flex items-center gap-1 ${mine ? "text-white/80 justify-end" : "text-gray-400"}`}>
                        <span>
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                        {mine && (
                          m.readAt ? (
                            <CheckCheck className="w-3 h-3 text-green-300" />
                          ) : m.id ? (
                            <CheckCheck className="w-3 h-3 text-white/70" />
                          ) : (
                            <Check className="w-3 h-3 text-white/70" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottom} />
            </div>

            {chatLocked ? (
              <div className="px-4 py-3 border-t border-[#F6F3F3] bg-[#FBF9F9] text-center">
                <p className="text-[12px] text-[#606060]">
                  Chat ditutup — pesanan sudah <strong>{orderStatus}</strong>.
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Riwayat percakapan tetap bisa dibaca.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-3 border-t border-[#F6F3F3]">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Tulis pesan..."
                  className="flex-1 bg-[#FBF9F9] rounded-full px-4 py-2.5 text-sm border border-[#F6F3F3] focus:outline-none focus:border-[#B20605]"
                />
                <button
                  onClick={send}
                  disabled={!draft.trim() || sending}
                  className="w-10 h-10 rounded-full bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function senderLabel(t) {
  return t === "customer" ? "Customer" : t === "sales" ? "Sales" : t === "admin" ? "Admin SO" : "User";
}
