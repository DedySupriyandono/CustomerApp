import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bell, ShoppingCart, Camera, X, Trash2, Scan,
} from "lucide-react";
import api from "../api/api";
import BottomNav from "../components/BottomNav";
import { useCart } from "../contexts/CartContext";
import { rupiah } from "../utils/format";

// Load html5-qrcode dari CDN sekali per session.
function ensureHtml5QrcodeLoaded() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("no window");
    if (window.Html5Qrcode) return resolve(window.Html5Qrcode);
    const existing = document.querySelector('script[data-html5-qrcode]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Html5Qrcode));
      existing.addEventListener("error", () => reject(new Error("script error")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    s.async = true;
    s.dataset.html5Qrcode = "1";
    s.onload = () => resolve(window.Html5Qrcode);
    s.onerror = () => reject(new Error("Gagal load html5-qrcode"));
    document.head.appendChild(s);
  });
}

export default function Sell() {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  const [cart, setCart] = useState([]);         // [{qr, productId, productName, unitPrice}]
  const [manualQr, setManualQr] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusKind, setStatusKind] = useState(""); // ok | err
  const [busy, setBusy] = useState(false);
  const [camOn, setCamOn] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const scannerRef = useRef(null);
  const lastDecoded = useRef({ code: "", at: 0 });

  useEffect(() => {
    return () => {
      try { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); } catch (e) {}
    };
  }, []);

  function beep(ok) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "square"; o.frequency.value = ok ? 880 : 220; g.gain.value = 0.08;
      o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 120);
    } catch (e) {}
  }

  async function tryAdd(code) {
    const c = (code || "").trim();
    if (!c) return;
    // Debounce kamera (sama SN per-frame).
    const now = Date.now();
    if (lastDecoded.current.code === c && now - lastDecoded.current.at < 2500) return;
    lastDecoded.current = { code: c, at: now };

    if (cart.some((x) => x.qr === c)) {
      setStatusKind("err");
      setStatusMsg(`SN ${c} sudah di keranjang.`);
      beep(false);
      return;
    }
    setBusy(true);
    setStatusKind("");
    setStatusMsg(`Memvalidasi ${c}…`);
    try {
      const r = await api.get("/customer/sell/check", { params: { qr: c } });
      if (!r.data.success) {
        setStatusKind("err");
        setStatusMsg(r.data.message || "SN tidak valid.");
        beep(false);
        return;
      }
      const it = r.data.item;
      setCart((prev) => [...prev, {
        qr: it.sn, productId: it.productId,
        productName: it.productName || `Product #${it.productId}`,
        productNumber: it.productNumber,
        unitPrice: Number(it.unitPrice || 0),
      }]);
      setStatusKind("ok");
      setStatusMsg(`✓ ${c} ditambah ke keranjang.`);
      setManualQr("");
      beep(true);
    } catch (e) {
      setStatusKind("err");
      setStatusMsg(e.response?.data?.message || "Server error.");
      beep(false);
    } finally {
      setBusy(false);
    }
  }

  function removeItem(qr) {
    setCart((prev) => prev.filter((x) => x.qr !== qr));
  }

  function updatePrice(qr, val) {
    const num = Number(val) || 0;
    setCart((prev) => prev.map((x) => (x.qr === qr ? { ...x, unitPrice: num } : x)));
  }

  const cartTotal = cart.reduce((s, x) => s + Number(x.unitPrice || 0), 0);

  async function startCamera() {
    setStatusMsg("Memuat kamera…");
    try {
      const Html5Qrcode = await ensureHtml5QrcodeLoaded();
      const scanner = new Html5Qrcode("sell-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 160 } },
        (decoded) => tryAdd(decoded),
        () => {}
      );
      setCamOn(true);
      setStatusMsg("Arahkan ke QR / barcode…");
    } catch (e) {
      setStatusMsg("Kamera gagal: " + (e.message || e));
      setCamOn(false);
    }
  }

  async function stopCamera() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (e) {}
      scannerRef.current = null;
    }
    setCamOn(false);
  }

  async function submit() {
    if (cart.length === 0) {
      alert("Keranjang kosong. Scan/ketik SN dulu.");
      return;
    }
    if (!window.confirm(`Konfirmasi jual ${cart.length} item senilai ${rupiah(cartTotal)}?`)) return;
    setSubmitting(true);
    try {
      const r = await api.post("/customer/sell", {
        items: cart.map((x) => ({ qr: x.qr, unitPrice: x.unitPrice })),
        buyerName: buyerName.trim() || null,
        buyerPhone: buyerPhone.trim() || null,
      });
      if (r.data?.success) {
        await stopCamera();
        alert(`${r.data.message}\nTotal: ${rupiah(r.data.totalAmount)}`);
        setCart([]); setBuyerName(""); setBuyerPhone("");
        setStatusKind(""); setStatusMsg("");
      } else {
        alert(r.data?.message || "Gagal menjual.");
      }
    } catch (e) {
      alert(e.response?.data?.message || "Server error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="mobile-container relative shadow-2xl pb-28"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b from-[#540101] to-[#2A0000] z-0" />

      <div className="relative z-10">
        <header className="flex items-center justify-between px-5 pt-12 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-base font-bold leading-[26px]">Penjualan</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>
            <button
              onClick={() => navigate("/checkout")}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative"
              aria-label="Keranjang"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B20605] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </header>

        <section className="bg-[#FBF9F9] rounded-t-[20px] -mt-2 min-h-[calc(100vh-180px)] px-5 pt-[18px]">
          {/* Scan area */}
          <div className="bg-white rounded-2xl p-4 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)] mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-[#1A0000] text-[14px] flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-[#B20605]" /> Scan QR / SN
              </div>
              {!camOn ? (
                <button
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 bg-[#B20605] text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                >
                  <Camera className="w-4 h-4" /> Kamera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="inline-flex items-center gap-1.5 bg-gray-200 text-[#1A0000] text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                >
                  <X className="w-4 h-4" /> Stop
                </button>
              )}
            </div>
            <div
              id="sell-reader"
              style={{ width: "100%", maxWidth: 360, display: camOn ? "block" : "none" }}
            />
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={manualQr}
                onChange={(e) => setManualQr(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") tryAdd(manualQr); }}
                placeholder="Ketik QR / SN manual"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px]"
              />
              <button
                onClick={() => tryAdd(manualQr)}
                disabled={busy || !manualQr.trim()}
                className="bg-[#B20605] text-white text-[13px] font-semibold px-4 rounded-lg disabled:opacity-50"
              >
                Tambah
              </button>
            </div>
            {statusMsg && (
              <div
                className={`mt-2 text-[12px] ${
                  statusKind === "ok" ? "text-[#1F7A4D]" : statusKind === "err" ? "text-red-600" : "text-gray-500"
                }`}
              >
                {statusMsg}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white rounded-2xl p-4 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)] mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-[#1A0000] text-[14px]">Keranjang Jual</div>
              <div className="text-[12px] text-gray-500">{cart.length} item</div>
            </div>
            {cart.length === 0 ? (
              <div className="text-[12px] text-gray-400 text-center py-4">
                Belum ada item. Scan QR / SN dari stok Anda.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {cart.map((it) => (
                  <li key={it.qr} className="py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#1A0000] truncate">
                          {it.productName}
                        </div>
                        <div className="text-[11px] text-[#B20605]">
                          <code>{it.qr}</code>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(it.qr)}
                        aria-label="Hapus"
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[11px] text-gray-500">Harga Jual</span>
                      <input
                        type="number"
                        value={it.unitPrice}
                        onChange={(e) => updatePrice(it.qr, e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-[12px] text-right"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-[13px] text-gray-500">Total</span>
              <span className="text-[16px] font-bold text-[#B20605]">{rupiah(cartTotal)}</span>
            </div>
          </div>

          {/* Buyer info */}
          <div className="bg-white rounded-2xl p-4 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)] mb-3">
            <div className="font-bold text-[#1A0000] text-[14px] mb-3">Pembeli (opsional)</div>
            <div className="space-y-2">
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nama pembeli"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px]"
              />
              <input
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="No. HP pembeli"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px]"
              />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={submitting || cart.length === 0}
            className="w-full bg-[#1F7A4D] hover:bg-[#175e3a] disabled:bg-gray-300 text-white text-[14px] font-bold py-3 rounded-xl transition"
          >
            {submitting ? "Memproses…" : `Jual Sekarang (${rupiah(cartTotal)})`}
          </button>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
