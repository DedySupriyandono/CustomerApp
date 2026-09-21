import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bell, Camera, X, Trash2, Scan,
  ChevronDown, ChevronUp, Plus, Package, Layers,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import salesApi from "../../api/salesApi";
import { useSalesAuth } from "../../contexts/SalesAuthContext";
import SalesBottomNav from "../../components/SalesBottomNav";
import { rupiah } from "../../utils/format";
import { qrExtract } from "../../utils/qrNormalize";

// Row keranjang — di-memo supaya cart 17k+ item tidak re-render ulang
// tiap parent update state lain (buyer name/phone, accordion, dsb).
// Props diminimalkan (qr, productName, unitPrice) supaya shallow compare cepat.
// Handler di parent WAJIB useCallback biar identity stabil antar render.
const CartRow = memo(function CartRow({ qr, productName, unitPrice, onRemove, onPriceChange }) {
  return (
    <li className="py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[#1A0000] truncate">{productName}</div>
          <div className="text-[11px] text-[#B20605]"><code>{qr}</code></div>
        </div>
        <button
          onClick={() => onRemove(qr)}
          aria-label="Hapus"
          className="text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[11px] text-gray-500">Harga Jual</span>
        {/* SF boleh override harga (bebas > 0). Server log ke sales_price_overrides
            + update SSV.SalesPrice. MasterSalesPrice tetap snapshot immutable. */}
        <input
          type="number"
          value={unitPrice}
          min="1"
          step="1"
          onChange={(e) => onPriceChange(qr, e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-[12px] text-right"
        />
      </div>
    </li>
  );
});

// Mirror Sell.jsx untuk customer — versi sales.
// Sales scan SN dari stock-nya sendiri (yg di-receive saat SLO Selesai)
// lalu jual ke pembeli. SN dipake "tap" dari list atau scan kamera.
export default function SalesSell() {
  const navigate = useNavigate();
  const { sales } = useSalesAuth();

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
  const [groupSearch, setGroupSearch] = useState({}); // per-productId search filter

  // Persist cart + buyer di localStorage — survive refresh, tab close, browser
  // restart. Auto-clear di 3 titik: (1) sell sukses, (2) user logout, (3) user
  // login ulang (di SalesAuthContext). Key per user_id → cart user A tidak
  // nyangkut saat user B login di device sama.
  // sales object dari SalesAuthContext punya field `userId` (server SalesAuthResponse.UserId),
  // bukan `id` — check exact field name via `console.log(sales)` kalau berubah.
  const salesUid = sales?.userId ?? sales?.id ?? "anon";
  const STORAGE_KEY = `sales_sell_state_v1_${salesUid}`;
  const hydratedRef = useRef(false); // skip save saat first load (belum hydrated)

  // Cross-tab claims — cegah SN sama dipakai di 2 tab (localStorage shared antar
  // tab origin sama). Tiap tab punya TAB_ID unik → tahu "claim ini punya siapa".
  const CLAIMS_KEY = `sales_sell_claims_v1_${salesUid}`;
  const tabIdRef = useRef(Math.random().toString(36).slice(2) + Date.now().toString(36));
  const readClaims = () => {
    try { return JSON.parse(localStorage.getItem(CLAIMS_KEY) || "{}"); } catch { return {}; }
  };
  const writeClaims = (obj) => {
    try { localStorage.setItem(CLAIMS_KEY, JSON.stringify(obj)); } catch {}
  };
  const claimSn = (qr) => { const c = readClaims(); c[qr] = tabIdRef.current; writeClaims(c); };
  const claimMany = (qrs) => {
    const c = readClaims(); qrs.forEach((q) => { c[q] = tabIdRef.current; }); writeClaims(c);
  };
  const unclaimSn = (qr) => {
    const c = readClaims(); if (c[qr] === tabIdRef.current) { delete c[qr]; writeClaims(c); }
  };
  const unclaimAllMine = () => {
    const c = readClaims();
    for (const q of Object.keys(c)) if (c[q] === tabIdRef.current) delete c[q];
    writeClaims(c);
  };
  const isClaimedByOther = (qr) => {
    const c = readClaims();
    return c[qr] && c[qr] !== tabIdRef.current;
  };

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

  // Cleanup claims saat tab ditutup / component unmount — supaya SN tidak
  // "nyangkut" di localStorage kalau tab crash / user tutup tanpa jual.
  useEffect(() => {
    const onBeforeUnload = () => unclaimAllMine();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      unclaimAllMine();
    };
  }, [salesUid]);

  // Hydrate cart+buyer dari sessionStorage saat mount / saat user_id berubah
  // (login akun beda di device sama → reset ke state kosong + load key user baru).
  // Re-validate tiap SN (silent — SN yg sudah tidak Available auto-remove).
  useEffect(() => {
    console.log("[sell-cart] hydrate: START sales=", sales, "key=", STORAGE_KEY);
    let cancelled = false;
    hydratedRef.current = false;
    setCart([]); setBuyerName(""); setBuyerPhone("");
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        console.log("[sell-cart] hydrate: raw from localStorage =", raw);
        if (raw) {
          const s = JSON.parse(raw);
          console.log("[sell-cart] hydrate: parsed", { cartLen: s?.cart?.length, buyerName: s?.buyerName, buyerPhone: s?.buyerPhone });
          if (s && Array.isArray(s.cart) && s.cart.length > 0) {
            const results = await Promise.all(
              s.cart.map((it) =>
                salesApi
                  .get("/sales/sell/check", { params: { qr: it.qr } })
                  .then((r) => {
                    console.log("[sell-cart] hydrate: check", it.qr, "→", r.data?.success ? "OK" : "REMOVED:", r.data?.message);
                    return r.data?.success ? { ...it, unitPrice: Number(r.data.item.unitPrice || it.unitPrice || 0) } : null;
                  })
                  .catch((err) => { console.warn("[sell-cart] hydrate: check FAIL", it.qr, err?.response?.status, err?.message); return null; })
              )
            );
            const valid = results.filter(Boolean);
            console.log("[sell-cart] hydrate: validated", valid.length, "/", s.cart.length, "SN survived");
            if (!cancelled) {
              setCart(valid);
              claimMany(valid.map((x) => x.qr));
            }
          }
          if (s && typeof s.buyerName === "string") setBuyerName(s.buyerName);
          if (s && typeof s.buyerPhone === "string") setBuyerPhone(s.buyerPhone);
        } else {
          console.log("[sell-cart] hydrate: no saved cart");
        }
      } catch (e) {
        console.error("[sell-cart] hydrate: EXCEPTION", e);
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
      } finally {
        if (!cancelled) { hydratedRef.current = true; console.log("[sell-cart] hydrate: DONE, hydratedRef=true"); }
      }
    })();
    return () => { cancelled = true; };
  }, [salesUid]);

  useEffect(() => {
    if (!hydratedRef.current) { console.log("[sell-cart] save: SKIP (not hydrated yet)", { cartLen: cart.length }); return; }
    try {
      const payload = JSON.stringify({ cart, buyerName, buyerPhone });
      localStorage.setItem(STORAGE_KEY, payload);
      console.log("[sell-cart] save: OK key=", STORAGE_KEY, "cartLen=", cart.length, "bytes=", payload.length);
    } catch (e) {
      console.error("[sell-cart] save: FAIL", e);
    }
  }, [cart, buyerName, buyerPhone]);

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
    if (isClaimedByOther(c)) {
      setStatusKind("err");
      setStatusMsg(`SN ${c} sudah dipakai di tab/sesi lain.`);
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
      let added = true;
      // Race guard: check claims sekali lagi (tab lain mungkin claim di sela-sela check).
      if (isClaimedByOther(it.sn)) {
        setStatusKind("err"); setStatusMsg(`SN ${it.sn} sudah dipakai di tab/sesi lain.`);
        beep(false); return;
      }
      // Functional dedupe — kalau 2 scan kamera concurrent utk SN sama,
      // setter kedua lihat prev sudah ada → skip. Cegah bug double-add.
      setCart((prev) => {
        if (prev.some((x) => x.qr === it.sn)) { added = false; return prev; }
        return [...prev, {
          qr: it.sn, productId: it.productId,
          productName: it.productName || `Product #${it.productId}`,
          productNumber: it.productNumber,
          unitPrice: Number(it.unitPrice || 0),
        }];
      });
      if (!added) {
        setStatusKind("err"); setStatusMsg(`SN ${it.sn} sudah di keranjang.`);
        beep(false); return;
      }
      claimSn(it.sn);
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

  // useCallback biar identity handler stabil — kalau bikin arrow inline tiap
  // render, memo CartRow kena bust karena onRemove/onPriceChange beda pointer.
  const removeItem = useCallback((qr) => {
    setCart((prev) => prev.filter((x) => x.qr !== qr));
    unclaimSn(qr);
  }, [salesUid]);

  const updatePrice = useCallback((qr, val) => {
    const num = Number(val) || 0;
    setCart((prev) => prev.map((x) => (x.qr === qr ? { ...x, unitPrice: num } : x)));
  }, []);

  // Bulk edit harga per productId — kasus promo 300 SN sama product perlu
  // harga baru, tidak perlu edit 1-per-1.
  function bulkUpdatePriceByProduct(productId, productName, count) {
    const inputEl = document.getElementById(`bulk-price-${productId}`);
    const val = Number(inputEl?.value || 0);
    if (!val || val <= 0) {
      setStatusKind("err"); setStatusMsg("Harga harus > 0"); beep(false); return;
    }
    if (!window.confirm(`Ubah harga ${count} SN "${productName}" jadi ${rupiah(val)}?`)) return;
    setCart((prev) => prev.map((x) => (x.productId === productId ? { ...x, unitPrice: val } : x)));
    if (inputEl) inputEl.value = "";
    setStatusKind("ok"); setStatusMsg(`✓ ${count} SN diubah ke ${rupiah(val)}`); beep(true);
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

  // SMART range scan — server filter SN yg SF pegang Available dalam range
  // (WHERE sales_force_id=me AND SN BETWEEN start AND end AND status=Available).
  // Client cuma kirim {startSn, endSn} → 1 HTTP call, tanpa enumerate 100rb SN,
  // tanpa cap RANGE_MAX. Cocok utk voucher 12+ digit yg range antar SN
  // bisa jutaan. Server extract SN dari URL provider via qr_pattern.
  async function doScanRange() {
    if (!rangeFrom.trim() || !rangeTo.trim()) {
      setRangeKind("err"); setRangeMsg("SN Awal & Akhir wajib."); beep(false);
      return;
    }

    setRangeBusy(true);
    setRangeKind("");
    setRangeProgress({ done: 0, total: 0 });
    setRangeMsg("Filter database…");

    try {
      const r = await salesApi.post("/sales/sell/scan-range-smart", {
        startSn: rangeFrom.trim(),
        endSn:   rangeTo.trim(),
      });
      const data = r.data || {};
      if (!data.success) {
        setRangeKind("err");
        setRangeMsg(data.message || "Gagal validasi range.");
        beep(false);
        return;
      }

      // Dedup vs cart client-side (server tidak tahu isi cart)
      const inCart = new Set(cart.map((x) => x.qr));
      const rawAdded = (data.added || []).filter((it) => !inCart.has(it.sn));
      const otherTabSkip = rawAdded.filter((it) => isClaimedByOther(it.sn)).length;
      const added  = rawAdded.filter((it) => !isClaimedByOther(it.sn));
      const inCartSkip = (data.added || []).length - rawAdded.length;

      if (added.length > 0) {
        setCart((prev) => {
          const prevSet = new Set(prev.map((x) => x.qr));
          const fresh = added
            .filter((it) => !prevSet.has(it.sn))
            .map((it) => ({
              qr: it.sn, productId: it.productId,
              productName: it.productName || `Product #${it.productId}`,
              productNumber: it.productNumber,
              unitPrice: Number(it.unitPrice || 0),
            }));
          if (fresh.length === 0) return prev;
          claimMany(fresh.map((x) => x.qr));
          return [...prev, ...fresh];
        });
      }

      let summary = `✓ ${added.length} SN ditambah dari ${data.summary?.totalFound ?? added.length} SN milik Anda dalam range`;
      if (inCartSkip > 0)    summary += ` · ${inCartSkip} sudah di keranjang`;
      if (otherTabSkip > 0)  summary += ` · ${otherTabSkip} dipakai di tab lain`;
      setRangeKind(added.length > 0 ? "ok" : "err");
      setRangeMsg(summary);
      beep(added.length > 0);
      if (added.length > 0) { setRangeFrom(""); setRangeTo(""); }
    } catch (err) {
      const msg = err.response?.data?.message || "Server error";
      setRangeKind("err"); setRangeMsg(`Gagal: ${msg}`); beep(false);
    } finally {
      setRangeBusy(false);
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
    if (isClaimedByOther(sn)) {
      setStatusKind("err"); setStatusMsg(`SN ${sn} sudah dipakai di tab/sesi lain.`);
      beep(false); return;
    }
    let added = true;
    setCart((prev) => {
      if (prev.some((x) => x.qr === sn)) { added = false; return prev; }
      return [...prev, {
        qr: sn, productId: group.productId,
        productName: group.productName || `Product #${group.productId}`,
        productNumber: group.productNumber,
        unitPrice: Number(group.unitPrice || 0),
      }];
    });
    if (!added) {
      setStatusKind("err"); setStatusMsg(`SN ${sn} sudah di keranjang.`);
      return;
    }
    claimSn(sn);
    setStatusKind("ok");
    setStatusMsg(`✓ ${sn} ditambah.`);
    beep(true);
  }

  // Memoize supaya keystroke buyer/toggle accordion tidak trigger reduce 17k row lagi.
  const cartTotal = useMemo(
    () => cart.reduce((s, x) => s + Number(x.unitPrice || 0), 0),
    [cart]
  );

  // Set lookup — hindari cart.some(...) per SN di stock accordion body
  // (O(n*m) = 17k*17k = 300M ops → freeze). Set.has = O(1).
  const cartQrSet = useMemo(() => new Set(cart.map((c) => c.qr)), [cart]);

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
    // Guard harga: semua item wajib > 0 (SF bebas set nilai apapun asal > 0).
    const badIdx = cart.findIndex((x) => !(Number(x.unitPrice) > 0));
    if (badIdx >= 0) {
      alert(`SN ${cart[badIdx].qr}: harga jual harus > 0.`);
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
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        unclaimAllMine();
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
              <div className="text-[11px] text-gray-400">smart · tanpa batas</div>
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
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                onClick={doScanRange}
                disabled={rangeBusy || !rangeFrom.trim() || !rangeTo.trim()}
                className="bg-[#B20605] text-white text-[13px] font-semibold px-4 py-2 rounded-lg disabled:opacity-50 shrink-0"
              >
                {rangeBusy ? "Memproses…" : "Scan Range"}
              </button>
            </div>

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
                    {isOpen && (() => {
                      const q = (groupSearch[g.productId] || "").trim().toLowerCase();
                      const filtered = q ? g.items.filter((it) => (it.sn || "").toLowerCase().includes(q)) : g.items;
                      return (
                        <>
                          <input
                            type="text"
                            value={groupSearch[g.productId] || ""}
                            onChange={(e) => setGroupSearch((p) => ({ ...p, [g.productId]: e.target.value }))}
                            placeholder="Cari SN..."
                            className="w-full mt-2 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px]"
                            inputMode="text"
                            autoComplete="off"
                          />
                          {q && (
                            <div className="text-[11px] text-gray-500 mt-1 px-1">
                              {filtered.length} dari {g.items.length} SN
                            </div>
                          )}
                          <ul className="mt-2 space-y-1.5 pl-2">
                            {filtered.length === 0 && (
                              <li className="text-[11px] text-gray-400 text-center py-2">Tidak ada SN cocok.</li>
                            )}
                            {filtered.map((it) => {
                              const inCart = cartQrSet.has(it.sn);
                              return (
                                <li
                                  key={it.sn}
                                  className="flex items-center justify-between gap-2 bg-[#FBF9F9] rounded-lg px-2.5 py-1.5"
                                >
                                  <code className="text-[11px] text-[#B20605] truncate flex-1">{it.sn}</code>
                                  {inCart && (
                                    <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                                      ✓ Di keranjang
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      );
                    })()}
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
              <>
                {/* Bulk edit harga per product — cepat kalau promo N SN sama product */}
                {(() => {
                  const groups = new Map();
                  cart.forEach((it) => {
                    if (!groups.has(it.productId))
                      groups.set(it.productId, { productId: it.productId, productName: it.productName, count: 0, sample: it.unitPrice });
                    groups.get(it.productId).count += 1;
                  });
                  const arr = Array.from(groups.values());
                  if (arr.length === 0) return null;
                  return (
                    <div className="mb-3 p-2.5 bg-[#FFF8F0] rounded-lg border border-[#FFE7CE]">
                      <div className="text-[11px] font-semibold text-[#B20605] mb-1.5">Ubah Harga per Product</div>
                      <div className="space-y-1.5">
                        {arr.map((g) => (
                          <div key={g.productId} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-semibold truncate">{g.productName}</div>
                              <div className="text-[10px] text-gray-500">{g.count} SN · sekarang ~{rupiah(g.sample)}</div>
                            </div>
                            <input
                              type="number"
                              defaultValue=""
                              placeholder="harga baru"
                              min="1"
                              step="1"
                              id={`bulk-price-${g.productId}`}
                              className="w-24 border border-gray-200 rounded px-2 py-1 text-[12px] text-right"
                            />
                            <button
                              type="button"
                              className="bg-[#B20605] text-white text-[11px] font-semibold px-2.5 py-1 rounded"
                              onClick={() => bulkUpdatePriceByProduct(g.productId, g.productName, g.count)}
                            >
                              Terapkan
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <ul className="divide-y divide-gray-100">
                  {cart.map((it) => (
                    <CartRow
                      key={it.qr}
                      qr={it.qr}
                      productName={it.productName}
                      unitPrice={it.unitPrice}
                      onRemove={removeItem}
                      onPriceChange={updatePrice}
                    />
                  ))}
                </ul>
              </>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-[13px] text-gray-500">Total</span>
              <span className="text-[16px] font-bold text-[#B20605]">{rupiah(cartTotal)}</span>
            </div>
          </div>

          {/* Buyer */}
          <div className="bg-white rounded-2xl p-4 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)] mb-3">
            <div className="font-bold text-[#1A0000] text-[14px] mb-3">Pembeli</div>
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
