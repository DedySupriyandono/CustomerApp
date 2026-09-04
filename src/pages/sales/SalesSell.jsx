import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bell, Camera, X, Trash2, Scan,
  ChevronDown, ChevronUp, Plus, Package, Layers,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import salesApi from "../../api/salesApi";
import SalesBottomNav from "../../components/SalesBottomNav";
import { rupiah } from "../../utils/format";
import { qrExtract } from "../../utils/qrNormalize";

// Mirror Sell.jsx untuk customer — versi sales.
// Sales scan SN dari stock-nya sendiri (yg di-receive saat SLO Selesai)
// lalu jual ke pembeli. SN dipake "tap" dari list atau scan kamera.
export default function SalesSell() {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [manualQr, setManualQr] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusKind, setStatusKind] = useState("");
  const [busy, setBusy] = useState(false);
  const [camOn, setCamOn] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [stock, setStock] = useState({ totalQty: 0, groups: [] });
  const [stockLoading, setStockLoading] = useState(true);
  const [stockErr, setStockErr] = useState("");
  const [expanded, setExpanded] = useState({});

  // Scan Range state — bulk add SN dari From..To (max 1000 per batch).
  // Untuk voucher/kartu perdana yg SN-nya sequential numeric — cepat drpd
  // scan satu-satu.
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [rangeBusy, setRangeBusy] = useState(false);
  const [rangeMsg, setRangeMsg] = useState("");
  const [rangeKind, setRangeKind] = useState(""); // "ok" | "err" | ""
  const [rangeProgress, setRangeProgress] = useState({ done: 0, total: 0 });
  const RANGE_MAX   = 100000; // total cap client-side (naikkan bertahap sesuai kebutuhan bisnis)
  const CHUNK_SIZE  = 500;    // SN per POST — di bawah server cap 1000; naik dari 100 utk kurangi round-trip di range besar

  const scannerRef = useRef(null);
  const lastDecoded = useRef({ code: "", at: 0 });

  const loadStock = () => {
    setStockLoading(true);
    setStockErr("");
    salesApi
      .get("/sales/sell/stock")
      .then((r) => setStock(r.data || { totalQty: 0, groups: [] }))
      .catch((e) => setStockErr(e.response?.data?.message || "Gagal memuat stok"))
      .finally(() => setStockLoading(false));
  };

  useEffect(() => {
    loadStock();
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
    // Extract SN "cantik" dulu — support paste URL Telkomsel / voucher.
    // Server pakai categories.qr_pattern; kalau bukan URL, return as-is.
    const c = await qrExtract(salesApi, "sales", code);
    if (!c) return;
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
      const r = await salesApi.get("/sales/sell/check", { params: { qr: c } });
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

  // Normalize input SN — strip URL wrapper + potong 15-digit fisik ke 12-digit
  // internal SN. Kalau tidak match pattern URL/15-digit → passthrough (SN dgn
  // prefix huruf mis. V001, atau 12-digit pure numeric tetap valid).
  //
  // Kenapa perlu:
  //   User paste URL Telkomsel `https://www.telkomsel.com/…?sn=252888448906398`
  //   (60+ char, 15-digit trailing). Kalau di-subtract as-is, delta count-nya
  //   ke-inflasi 1000× karena 3 digit terakhir (`398`) yang konstan ikut
  //   di-subtract. Contoh: 200 SN kelihatan jadi 200.000 SN → melebihi cap.
  //   Server-side sudah punya QrSnExtractor via categories.qr_pattern, tapi
  //   client-side compute count TIDAK punya akses ke pattern itu → harus
  //   normalize lokal supaya subtract & progress bar akurat.
  function normalizeSnInput(raw) {
    const s = String(raw || "").trim();
    if (s === "") return "";
    // Case 1: URL dgn query `?sn=<digits>` atau `&sn=<digits>` — extract.
    const mUrl = s.match(/[?&]sn=(\d+)/i);
    if (mUrl) {
      const d = mUrl[1];
      return d.length === 15 ? d.slice(0, 12) : d;
    }
    // Case 2: pure 15-digit fisik voucher → potong ke 12-digit SN internal.
    if (/^\d{15}$/.test(s)) return s.slice(0, 12);
    // Case 3: rest (SN dgn prefix huruf, 12-digit pure, format lain) →
    // passthrough. generateSnRange handle regex-nya.
    return s;
  }

  // Generate array SN dari From..To. Support prefix huruf + suffix
  // numeric (mis. "V001A001".."V001A010"). Return [] kalau invalid
  // atau range lebih dari RANGE_MAX.
  //
  // Rule:
  //   - Pattern wajib: `^(.*?)(\d+)$` — bagian numeric HARUS di ujung.
  //   - Prefix (huruf/angka campuran) HARUS sama antara From & To.
  //   - Pad zero preserve length awal (mis. "001" → "002"..."010").
  function generateSnRange(from, to) {
    if (!from || !to) return { list: [], error: "From & To wajib diisi." };
    // Normalize dulu — URL Telkomsel / 15-digit fisik → 12-digit internal.
    // Kalau bukan format URL/15-digit, passthrough (SN alfanumerik tetap OK).
    const f = normalizeSnInput(from), t = normalizeSnInput(to);
    if (f === "" || t === "") return { list: [], error: "From & To wajib diisi." };

    const mFrom = /^(.*?)(\d+)$/.exec(f);
    const mTo   = /^(.*?)(\d+)$/.exec(t);
    if (!mFrom || !mTo) return { list: [], error: "SN harus berakhiran angka (mis. V001, 800586624418)." };
    if (mFrom[1] !== mTo[1]) return { list: [], error: `Prefix From (${mFrom[1] || "-"}) & To (${mTo[1] || "-"}) beda.` };

    const prefix    = mFrom[1];
    const startStr  = mFrom[2], endStr = mTo[2];
    const padLen    = Math.max(startStr.length, endStr.length);
    const start     = BigInt(startStr), end = BigInt(endStr);
    if (start > end) return { list: [], error: "From > To. Range terbalik." };
    const countBig = end - start + 1n;
    if (countBig > BigInt(RANGE_MAX))
      return { list: [], error: `Range terlalu besar (${countBig}). Max ${RANGE_MAX} per batch.` };

    const count = Number(countBig);
    const list = new Array(count);
    for (let i = 0; i < count; i++) {
      const num = (start + BigInt(i)).toString().padStart(padLen, "0");
      list[i] = prefix + num;
    }
    return { list, error: null };
  }

  async function doScanRange() {
    const { list, error } = generateSnRange(rangeFrom, rangeTo);
    if (error) {
      setRangeKind("err");
      setRangeMsg(error);
      beep(false);
      return;
    }
    // Dedup vs cart (SN yg sudah di keranjang di-skip di client, tidak
    // dikirim ke server — irit payload).
    const inCart = new Set(cart.map((x) => x.qr));
    const toSend = list.filter((sn) => !inCart.has(sn));
    if (toSend.length === 0) {
      setRangeKind("err");
      setRangeMsg(`Semua ${list.length} SN sudah di keranjang.`);
      beep(false);
      return;
    }

    setRangeBusy(true);
    setRangeKind("");
    setRangeProgress({ done: 0, total: toSend.length });
    setRangeMsg(`Memvalidasi ${toSend.length} SN…`);

    // Chunk client-side supaya:
    //   1. Payload per request tetap kecil (100 SN ≈ 1-2 KB) → hindari
    //      request body limit / lambat di mobile network.
    //   2. Progress bar bisa update per chunk — user liat kemajuan real.
    //   3. Kalau 1 chunk error, batch sebelumnya sudah masuk cart → tidak
    //      hilang semua kalau network kejeblak di tengah.
    const chunks = [];
    for (let i = 0; i < toSend.length; i += CHUNK_SIZE) {
      chunks.push(toSend.slice(i, i + CHUNK_SIZE));
    }

    const allAdded   = [];
    const allSkipped = [];
    let doneCount    = 0;
    let errorMsg     = null;

    try {
      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        try {
          const r = await salesApi.post("/sales/sell/scan-range", { sns: chunk });
          const added   = r.data?.added   || [];
          const skipped = r.data?.skipped || [];
          allAdded.push(...added);
          allSkipped.push(...skipped);

          // Merge langsung ke cart per chunk — user liat cart bertambah
          // real-time, bukan nunggu semua chunk selesai baru render.
          if (added.length > 0) {
            setCart((prev) => [
              ...prev,
              ...added.map((it) => ({
                qr: it.sn, productId: it.productId,
                productName: it.productName || `Product #${it.productId}`,
                productNumber: it.productNumber,
                unitPrice: Number(it.unitPrice || 0),
              })),
            ]);
          }
        } catch (chunkErr) {
          // Chunk gagal — catat error tapi lanjut chunk berikut supaya
          // sebagian data masih tersimpan. Kalau gagal semua → ditangani
          // di summary akhir.
          const chunkFailMsg = chunkErr.response?.data?.message || "Server error";
          errorMsg = `Chunk ${ci + 1}/${chunks.length} gagal: ${chunkFailMsg}`;
          allSkipped.push(
            ...chunk.map((sn) => ({ sn, reason: "chunk-failed" }))
          );
        }
        doneCount += chunk.length;
        setRangeProgress({ done: doneCount, total: toSend.length });
      }

      // Summary — tampilkan agregat dari semua chunk.
      const inCartSkip = list.length - toSend.length;
      let summary = `✓ ${allAdded.length} SN ditambah`;
      if (allSkipped.length > 0) {
        const byReason = allSkipped.reduce((acc, s) => {
          acc[s.reason] = (acc[s.reason] || 0) + 1; return acc;
        }, {});
        const reasons = Object.entries(byReason)
          .map(([k, v]) => `${v} ${k}`).join(", ");
        summary += ` · ${allSkipped.length} skip (${reasons})`;
      }
      if (inCartSkip > 0) summary += ` · ${inCartSkip} sudah di keranjang`;
      if (errorMsg) summary += `  [${errorMsg}]`;
      setRangeKind(allAdded.length > 0 ? "ok" : "err");
      setRangeMsg(summary);
      beep(allAdded.length > 0);
      if (allAdded.length > 0) { setRangeFrom(""); setRangeTo(""); }
    } finally {
      setRangeBusy(false);
      // Reset progress state setelah animasi selesai (progress bar hilang).
      setTimeout(() => setRangeProgress({ done: 0, total: 0 }), 1500);
    }
  }

  // Live preview jumlah SN kalau From/To valid — bantu user aware
  // sebelum klik Scan Range (cegah range gede kelewat).
  const rangePreview = (() => {
    if (!rangeFrom || !rangeTo) return null;
    const { list, error } = generateSnRange(rangeFrom, rangeTo);
    if (error) return { error };
    return { count: list.length };
  })();

  function addFromStock(sn, group) {
    if (cart.some((x) => x.qr === sn)) {
      setStatusKind("err");
      setStatusMsg(`SN ${sn} sudah di keranjang.`);
      return;
    }
    setCart((prev) => [...prev, {
      qr: sn, productId: group.productId,
      productName: group.productName || `Product #${group.productId}`,
      productNumber: group.productNumber,
      unitPrice: Number(group.unitPrice || 0),
    }]);
    setStatusKind("ok");
    setStatusMsg(`✓ ${sn} ditambah.`);
    beep(true);
  }

  const cartTotal = cart.reduce((s, x) => s + Number(x.unitPrice || 0), 0);

  async function startCamera() {
    if (camOn) return;
    setStatusKind("");
    setStatusMsg("Memuat kamera…");
    setCamOn(true);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const scanner = new Html5Qrcode("sales-sell-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 160 } },
        (decoded) => tryAdd(decoded),
        () => {}
      );
      setStatusMsg("Arahkan ke QR / barcode…");
    } catch (e) {
      setStatusKind("err");
      setStatusMsg("Kamera gagal: " + (e?.message || e || "izin ditolak"));
      setCamOn(false);
    }
  }

  async function stopCamera() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (e) {}
      try { await scannerRef.current.clear(); } catch (e) {}
      scannerRef.current = null;
    }
    setCamOn(false);
    setStatusMsg("");
  }

  async function submit() {
    if (cart.length === 0) {
      alert("Keranjang kosong. Scan/tap SN dari stok dulu.");
      return;
    }
    if (!window.confirm(`Konfirmasi jual ${cart.length} item senilai ${rupiah(cartTotal)}?`)) return;
    setSubmitting(true);
    try {
      const r = await salesApi.post("/sales/sell", {
        items: cart.map((x) => ({ qr: x.qr, unitPrice: x.unitPrice })),
        buyerName: buyerName.trim() || null,
        buyerPhone: buyerPhone.trim() || null,
      });
      if (r.data?.success) {
        await stopCamera();
        alert(`${r.data.message}\nTotal: ${rupiah(r.data.totalAmount)}`);
        setCart([]); setBuyerName(""); setBuyerPhone("");
        setStatusKind(""); setStatusMsg("");
        loadStock();
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
            <h1 className="text-white text-base font-bold leading-[26px]">Jual Stock Saya</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/sales/notifications")}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 text-white" />
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
              id="sales-sell-reader"
              style={{
                width: "100%", maxWidth: 360,
                minHeight: camOn ? 220 : 0,
                display: camOn ? "block" : "none",
              }}
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

          {/* Scan Range — bulk add SN sequential dari From..To.
              Untuk voucher/kartu perdana yg SN numeric berurutan. Max 1000/batch. */}
          <div className="bg-white rounded-2xl p-4 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)] mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-[#1A0000] text-[14px] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#B20605]" /> Scan Range
              </div>
              <div className="text-[11px] text-gray-400">max {RANGE_MAX}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-gray-500">From</label>
                <input
                  type="text"
                  value={rangeFrom}
                  onChange={(e) => { setRangeFrom(e.target.value); setRangeMsg(""); }}
                  placeholder="SN awal"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px]"
                  inputMode="text"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500">To</label>
                <input
                  type="text"
                  value={rangeTo}
                  onChange={(e) => { setRangeTo(e.target.value); setRangeMsg(""); }}
                  placeholder="SN akhir"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px]"
                  inputMode="text"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="text-[11px] flex-1 min-w-0 truncate">
                {rangePreview?.error && (
                  <span className="text-red-600">⚠ {rangePreview.error}</span>
                )}
                {rangePreview?.count > 0 && (
                  <span className="text-gray-600">
                    Akan validasi <b>{rangePreview.count}</b> SN
                  </span>
                )}
              </div>
              <button
                onClick={doScanRange}
                disabled={rangeBusy || !rangeFrom.trim() || !rangeTo.trim() || rangePreview?.error}
                className="bg-[#B20605] text-white text-[13px] font-semibold px-4 py-2 rounded-lg disabled:opacity-50 shrink-0"
              >
                {rangeBusy ? "…" : "Scan Range"}
              </button>
            </div>

            {/* Progress bar — muncul selagi chunk berjalan. Percentage
                dihitung dari doneCount vs total SN yg dikirim ke server. */}
            {rangeProgress.total > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>
                    <b>{rangeProgress.done}</b> / {rangeProgress.total} SN
                    {" · "}
                    {Math.round((rangeProgress.done / rangeProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#B20605] transition-all duration-200 ease-out"
                    style={{
                      width: `${Math.min(100, (rangeProgress.done / rangeProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {rangeMsg && (
              <div
                className={`mt-2 text-[12px] ${
                  rangeKind === "ok" ? "text-[#1F7A4D]" : rangeKind === "err" ? "text-red-600" : "text-gray-500"
                }`}
              >
                {rangeMsg}
              </div>
            )}
          </div>

          {/* Stock list */}
          <div className="bg-white rounded-2xl p-4 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)] mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-[#1A0000] text-[14px] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#B20605]" /> Stock Saya
              </div>
              <div className="text-[12px] text-gray-500">{stock.totalQty} unit</div>
            </div>
            {stockLoading && <div className="text-[12px] text-gray-400 text-center py-4">Memuat stok…</div>}
            {!stockLoading && stockErr && (
              <div className="text-[12px] text-red-600 text-center py-4">{stockErr}</div>
            )}
            {!stockLoading && !stockErr && stock.groups.length === 0 && (
              <div className="text-[12px] text-gray-400 text-center py-6">
                Belum ada stock. Selesaikan order pengiriman dulu utk dapat stock.
              </div>
            )}
            <ul className="divide-y divide-gray-100">
              {stock.groups.map((g) => {
                const isOpen = !!expanded[g.productId];
                return (
                  <li key={g.productId} className="py-2.5">
                    <button
                      type="button"
                      onClick={() => setExpanded((p) => ({ ...p, [g.productId]: !p[g.productId] }))}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#1A0000] truncate">
                          {g.productName || `Product #${g.productId}`}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {g.qty} unit · {rupiah(g.unitPrice)} / unit
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-[#FFF0E6] text-[#E87B1E] text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {g.qty}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    {isOpen && (
                      <ul className="mt-2 space-y-1.5 pl-2">
                        {g.items.map((it) => {
                          const inCart = cart.some((c) => c.qr === it.sn);
                          return (
                            <li
                              key={it.sn}
                              className="flex items-center justify-between gap-2 bg-[#FBF9F9] rounded-lg px-2.5 py-1.5"
                            >
                              <code className="text-[11px] text-[#B20605] truncate flex-1">{it.sn}</code>
                              {/* Tombol "Jual" per-SN di-hide — flow jual sekarang
                                  wajib via Scan QR/SN di atas (lebih konsisten
                                  dgn proses fisik & cegah double-entry). */}
                              {inCart && (
                                <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                                  ✓ Di keranjang
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-2xl p-4 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)] mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-[#1A0000] text-[14px]">Keranjang Jual</div>
              <div className="text-[12px] text-gray-500">{cart.length} item</div>
            </div>
            {cart.length === 0 ? (
              <div className="text-[12px] text-gray-400 text-center py-4">
                Belum ada item. Scan QR / tap dari Stock Saya di atas.
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

          {/* Buyer */}
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

      <SalesBottomNav />
    </div>
  );
}
