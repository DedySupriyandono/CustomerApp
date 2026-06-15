import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, ShoppingCart, ChevronDown, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import api from "../api/api";
import QuantityStepper from "../components/QuantityStepper";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { rupiah } from "../utils/format";

export default function Checkout() {
  const {
    items, setQty, remove, removeSerial,
    subtotal, promoTotal, netSubtotal, clear, totalItems, lineInfo,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [note, setNote] = useState(() => sessionStorage.getItem("orderNote") || "");
  const [delivery, setDelivery] = useState("Diantar Sales");
  const [payment, setPayment] = useState("COD");
  const [voucher, setVoucher] = useState("");
  const [voucherInfo, setVoucherInfo] = useState(null); // { valid, discount, label, message }
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [loading, setLoading] = useState(false);

  // Accordion + checkbox selection per produk (untuk Kartu Perdana / SN list)
  const [collapsed, setCollapsed] = useState({}); // { [productId]: true } = collapsed
  const [selected, setSelected] = useState({});   // { [productId]: { [sn]: true } }
  const toggleCollapse = (pid) => setCollapsed((p) => ({ ...p, [pid]: !p[pid] }));
  const toggleSelect = (pid, sn) =>
    setSelected((p) => {
      const cur = { ...(p[pid] || {}) };
      if (cur[sn]) delete cur[sn]; else cur[sn] = true;
      return { ...p, [pid]: cur };
    });
  const toggleSelectAll = (pid, serials) =>
    setSelected((p) => {
      const cur = p[pid] || {};
      const allChecked = serials.every((sn) => cur[sn]);
      if (allChecked) return { ...p, [pid]: {} };
      const next = {};
      for (const sn of serials) next[sn] = true;
      return { ...p, [pid]: next };
    });
  const selectedCount = (pid) => Object.keys(selected[pid] || {}).length;
  const removeSelectedSns = (pid) => {
    const set = selected[pid] || {};
    Object.keys(set).forEach((sn) => removeSerial(pid, sn));
    setSelected((p) => ({ ...p, [pid]: {} }));
  };

  const discount = voucherInfo?.valid ? Number(voucherInfo.discount) || 0 : 0;
  const deliveryFee = 0;
  const adminFee = 0;
  // netSubtotal already accounts for promo per item; voucher applied on top.
  const total = Math.max(0, netSubtotal - discount + deliveryFee + adminFee);

  // Re-validate voucher when subtotal changes (e.g. items added/removed).
  useEffect(() => {
    const code = voucher.trim();
    if (!code) {
      setVoucherInfo(null);
      return;
    }
    let cancelled = false;
    setVoucherChecking(true);
    const t = setTimeout(() => {
      api
        .get("/customer/vouchers/validate", { params: { code, subtotal } })
        .then((r) => !cancelled && setVoucherInfo(r.data))
        .catch((e) => !cancelled && setVoucherInfo({
          valid: false,
          message: e.response?.data?.message || "Voucher tidak valid",
        }))
        .finally(() => !cancelled && setVoucherChecking(false));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [voucher, subtotal]);

  const submit = async () => {
    if (items.length === 0) return;
    if (voucher.trim() && voucherInfo && !voucherInfo.valid) {
      Swal.fire({
        icon: "warning",
        title: "Voucher tidak valid",
        text: "Hapus dulu atau ganti dengan kode yang benar.",
        confirmButtonColor: "#B20605",
      });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        branchId: user?.branchId ? Number(user.branchId) : null,
        notes: note,
        deliveryMethod: delivery,
        paymentMethod: payment,
        voucherCode: voucher.trim() ? voucher.trim() : null,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          serials: i.serials || [],
        })),
      };
      console.log("[Checkout] POST /orders payload:", payload);
      const { data } = await api.post("/customer/orders", payload);
      console.log("[Checkout] response:", data);
      clear();
      sessionStorage.removeItem("orderNote");
      navigate(`/success/${data.id}`, { replace: true });
    } catch (e) {
      console.error("[Checkout] order error response:", e.response?.data);
      const data = e.response?.data || {};
      const msg =
        data.message ||
        data.title ||
        (typeof data === "string" ? data : null) ||
        e.message ||
        "Gagal membuat pesanan";
      const detail = data.detail ? `<div class="text-xs mt-2 text-gray-500">${data.detail}</div>` : "";
      // Status code di-render kecil di bawah biar pesan utama yang menonjol.
      Swal.fire({
        icon: "error",
        title: "Gagal Membuat Pesanan",
        html: `<div>${msg}</div>${detail}<div class="text-xs text-gray-400 mt-2">Status: ${e.response?.status || "—"}</div>`,
        confirmButtonColor: "#B20605",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mobile-container relative shadow-2xl pb-32"
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
            <h1 className="text-white text-base font-bold leading-[26px]">Rincian Pesanan</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative">
              <ShoppingCart className="w-5 h-5 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B20605] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </header>

      <div className="px-4 -mt-1">
        <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#FFF5F5] flex items-center justify-center text-[#B20605]">📍</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-[#1A0000] truncate">{user?.branchName || user?.customerName}</div>
            <div className="text-xs text-gray-500 truncate">{user?.address || "—"}</div>
          </div>
          <span className="text-gray-400">→</span>
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Produk Order</h3>
          {items.length === 0 ? (
            <div className="text-center text-gray-400 py-6 text-sm">Keranjang kosong</div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => {
                const hasSerials = it.serials && it.serials.length > 0;
                const li = lineInfo(it);
                const lineDiscount = it.unitPrice * it.quantity - li.subtotal;
                return (
                  <div key={it.productId} className="pb-3 border-b last:border-0">
                    <div className="flex justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium text-sm">{it.productName}</div>
                        {li.promo && (
                          <div className="mt-1 inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-200">
                            🎁 {li.label} · hemat {rupiah(lineDiscount)}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-right shrink-0">
                        {li.promo ? (
                          <>
                            <span className="line-through text-gray-400 text-xs block">
                              {rupiah(it.unitPrice)}
                            </span>
                            <span className="text-[#B20605] font-semibold">
                              {rupiah(it.unitPrice - li.discountPerUnit)}
                            </span>{" "}
                            <span className="text-gray-400">x {it.quantity}</span>
                          </>
                        ) : (
                          <>
                            {rupiah(it.unitPrice)}{" "}
                            <span className="text-gray-400">x {it.quantity}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {hasSerials ? (
                      <>
                        {/* Accordion header — toggle expand/collapse + select-all + bulk delete */}
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => toggleCollapse(it.productId)}
                            className="w-full flex items-center justify-between bg-[#FBF9F9] hover:bg-[#FFF5F5] rounded-lg px-3 py-2 transition"
                          >
                            <div className="flex items-center gap-2 text-[12px] text-[#1A0000]">
                              <ChevronDown
                                className={`w-4 h-4 text-[#B20605] transition-transform ${
                                  collapsed[it.productId] ? "-rotate-90" : ""
                                }`}
                              />
                              <span className="bg-[#FFF5F5] text-[#B20605] px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                {it.serials.length} nomor
                              </span>
                              {selectedCount(it.productId) > 0 && (
                                <span className="text-[10px] text-gray-500">
                                  ({selectedCount(it.productId)} dipilih)
                                </span>
                              )}
                            </div>
                            {selectedCount(it.productId) > 0 && (
                              <span
                                role="button"
                                onClick={(e) => { e.stopPropagation(); removeSelectedSns(it.productId); }}
                                className="text-[11px] text-[#B20605] font-semibold flex items-center gap-1 hover:underline"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Hapus {selectedCount(it.productId)}
                              </span>
                            )}
                          </button>

                          {!collapsed[it.productId] && (
                            <>
                              {/* Select-all toggle */}
                              <label className="flex items-center gap-2 px-1 py-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    it.serials.length > 0 &&
                                    it.serials.every((sn) => selected[it.productId]?.[sn])
                                  }
                                  onChange={() => toggleSelectAll(it.productId, it.serials)}
                                  className="w-4 h-4 accent-[#B20605]"
                                />
                                <span className="text-[11px] text-gray-500">Pilih semua</span>
                              </label>

                              <div className="space-y-1.5">
                                {it.serials.map((sn) => {
                                  const isChecked = !!selected[it.productId]?.[sn];
                                  return (
                                    <div
                                      key={sn}
                                      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                                        isChecked ? "bg-[#FFE4E4] border border-[#B20605]" : "bg-[#FFF5F5]"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleSelect(it.productId, sn)}
                                        className="w-4 h-4 accent-[#B20605] shrink-0"
                                        aria-label={`Pilih ${sn}`}
                                      />
                                      <span className="font-mono text-[13px] text-[#1A0000] flex-1 min-w-0 truncate">
                                        {sn}
                                      </span>
                                      <button
                                        onClick={() => removeSerial(it.productId, sn)}
                                        aria-label={`Hapus ${sn}`}
                                        className="w-7 h-7 rounded-full border border-[#B20605] text-[#B20605] flex items-center justify-center hover:bg-[#B20605] hover:text-white transition shrink-0"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}

                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => remove(it.productId)}
                              className="text-xs text-gray-500 underline"
                            >
                              Hapus semua
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => remove(it.productId)}
                          aria-label="Hapus item"
                          title="Hapus item"
                          className="w-7 h-7 rounded-full border border-[#B20605] text-[#B20605] flex items-center justify-center hover:bg-[#B20605] hover:text-white transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <QuantityStepper
                          value={it.quantity}
                          editable
                          onValidate={async (n) => {
                            try {
                              const { data } = await api.get(
                                `/customer/products/${it.productId}/stock`
                              );
                              const stock = Number(data?.stock ?? 0);
                              if (n > stock) {
                                return `Jumlah melebihi stok yang tersedia (stok: ${stock}).`;
                              }
                              return null;
                            } catch (e) {
                              return "Gagal cek stok. Coba lagi.";
                            }
                          }}
                          onChange={(v) =>
                            v === 0
                              ? remove(it.productId)
                              : setQty(
                                  {
                                    id: it.productId,
                                    productName: it.productName,
                                    productCode: it.productCode,
                                    salesPrice: it.unitPrice,
                                  },
                                  v
                                )
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <button
            onClick={() => navigate("/order")}
            className="w-full text-primary font-semibold text-sm py-2 mt-2"
          >
            + Tambah Pesanan
          </button>
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block font-semibold mb-2">
            Catatan Pesanan <span className="text-gray-400 font-normal text-sm">(Opsional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            rows={2}
            placeholder="Tulis catatan untuk pengiriman atau sales..."
            className="w-full bg-gray-50 rounded-xl p-3 text-sm border border-gray-200 focus:outline-none focus:border-primary resize-none"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{note.length} / 200</div>
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Metode Pengiriman</h3>
          {["Diantar Sales", "Ambil Sendiri"].map((m) => (
            <label key={m} className={`block border-2 rounded-xl p-3 mb-2 cursor-pointer ${delivery === m ? "border-primary bg-secondary" : "border-gray-200"}`}>
              <input
                type="radio"
                name="delivery"
                checked={delivery === m}
                onChange={() => setDelivery(m)}
                className="hidden"
              />
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{m}</div>
                  <div className="text-xs text-gray-500">Diantar pada hari kunjungan</div>
                </div>
                <span className="text-green-600 bg-green-100 text-xs px-2 py-1 rounded-full">Gratis</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Metode Pembayaran</h3>
          {[
            { v: "COD", label: "Cash On Delivery (COD)", icon: "💵" },
            { v: "Transfer Bank", label: "Transfer Bank", sub: "Bank BCA", icon: "🏦" },
          ].map((p) => (
            <label key={p.v} className={`block border-2 rounded-xl p-3 mb-2 cursor-pointer ${payment === p.v ? "border-primary bg-secondary" : "border-gray-200"}`}>
              <input type="radio" name="pay" checked={payment === p.v} onChange={() => setPayment(p.v)} className="hidden" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">{p.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{p.label}</div>
                  {p.sub && <div className="text-xs text-gray-500">{p.sub}</div>}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${payment === p.v ? "border-primary bg-primary" : "border-gray-300"}`} />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Voucher</h3>
          <div
            className={`rounded-xl p-3 flex items-center gap-2 border ${
              voucher.trim()
                ? voucherInfo?.valid
                  ? "bg-green-50 border-green-200"
                  : voucherChecking
                  ? "bg-gray-50 border-gray-200"
                  : "bg-red-50 border-red-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <span className="text-blue-600">🎟</span>
            <input
              value={voucher}
              onChange={(e) => setVoucher(e.target.value.toUpperCase())}
              placeholder="Masukan kode voucher"
              className="flex-1 outline-none text-sm bg-transparent"
            />
            {voucher && (
              <button
                onClick={() => setVoucher("")}
                className="text-gray-400 text-xs"
                aria-label="Hapus voucher"
              >
                ✕
              </button>
            )}
          </div>
          {voucher.trim() && (
            <div className="mt-2 text-xs">
              {voucherChecking ? (
                <span className="text-gray-500">Mengecek voucher...</span>
              ) : voucherInfo?.valid ? (
                <span className="text-green-700">
                  ✓ {voucherInfo.message} — Hemat {rupiah(voucherInfo.discount)}
                </span>
              ) : (
                <span className="text-red-600">
                  ✕ {voucherInfo?.message || "Voucher tidak valid"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Rincian Pembayaran</h3>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal Barang" value={rupiah(subtotal)} />
            {promoTotal > 0 && (
              <Row label="Diskon Promo Produk" value={"- " + rupiah(promoTotal)} />
            )}
            <Row label="Biaya Pengiriman" value={rupiah(deliveryFee)} />
            <Row label="Diskon Promo" value={"- " + rupiah(discount)} />
            <Row label="Biaya Admin" value={rupiah(adminFee)} />
            <div className="border-t border-dashed pt-2 mt-2 flex justify-between font-bold">
              <span>TOTAL PEMBAYARAN</span>
              <span>{rupiah(total)}</span>
            </div>
          </div>
        </div>
      </div>

      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 z-40">
        <div className="flex-1">
          <div className="text-xs text-gray-500">Total Pembayaran</div>
          <div className="font-bold text-[#1A0000]">{rupiah(total)}</div>
        </div>
        <button
          onClick={submit}
          disabled={loading || items.length === 0}
          className="bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-semibold px-8 py-3 rounded-full shadow-lg disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Buat Pesanan"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
