import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, Home as HomeIcon, ChevronRight, Clock, UserCheck, Truck, PartyPopper, XCircle, RotateCcw, Package } from "lucide-react";
import api from "../api/api";
import { rupiah } from "../utils/format";
import OrderItemsList from "../components/OrderItemsList";
import OrderChat from "../components/OrderChat";
import OrderTimeline from "../components/OrderTimeline";

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hasReview, setHasReview] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const reload = () => {
    setLoading(true);
    api
      .get(`/customer/orders/${id}`)
      .then((r) => {
        setOrder(r.data);
        if (r.data?.status === "Selesai") {
          api.get(`/customer/orders/${id}/review`)
            .then(rr => setHasReview(!!rr.data))
            .catch(() => {});
        }
      })
      .catch((e) => {
        console.error("[OrderSuccess]", e);
        setError(e.response?.data?.message || "Gagal memuat pesanan");
      })
      .finally(() => setLoading(false));
  };
  useEffect(reload, [id]);

  const confirmReceipt = async () => {
    if (!confirm("Konfirmasi barang sudah Anda terima dalam kondisi baik?")) return;
    setConfirming(true);
    try {
      await api.post(`/customer/orders/${id}/confirm-receipt`);
      reload();
    } catch (e) {
      alert(e.response?.data?.message || "Gagal konfirmasi");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className="mobile-container min-h-screen flex flex-col pb-10"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      {/* Top success area */}
      {(() => {
        const sv = statusVisual(order?.status);
        const Icon = sv.Icon;
        return (
          <div className="bg-gradient-to-b from-[#FFF5F5] via-white to-[#FBF9F9] pt-12 pb-6 px-6 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ${sv.bg}`}>
              <Icon className={`w-12 h-12 ${sv.color}`} strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-[#1A0000]">{sv.heading}</h1>
            <p className="text-[#606060] text-[13px] mt-1.5 leading-relaxed">{sv.message}</p>
          </div>
        );
      })()}

      <div className="flex-1 px-5 pt-2">
        {loading && <div className="text-center text-gray-400 py-8 text-sm">Memuat detail...</div>}
        {!loading && error && <div className="text-center text-red-600 py-8 text-sm">{error}</div>}

        {!loading && order && (
          <>
            {/* Order summary card */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
              <Row label="No. Pesanan" value={<span className="font-bold">{order.orderNumber}</span>} />
              <Divider />
              <Row
                label="Status"
                value={
                  <span className="bg-[#FFF0E6] text-[#E87B1E] px-3 py-1 rounded-full text-[11px] font-semibold">
                    {order.status}
                  </span>
                }
              />
              <Divider />
              <Row label="Tanggal" value={new Date(order.createdAt).toLocaleString("id-ID")} />
              {order.deliveryMethod && (
                <>
                  <Divider />
                  <Row label="Pengiriman" value={order.deliveryMethod} />
                </>
              )}
              {order.paymentMethod && (
                <>
                  <Divider />
                  <Row label="Pembayaran" value={order.paymentMethod} />
                </>
              )}
              <Divider />
              <Row
                label="Total"
                value={
                  <span className="text-[#B20605] font-bold text-[16px]">
                    {rupiah(order.total)}
                  </span>
                }
              />
            </div>

            {/* Timeline */}
            <div className="mt-4">
              <OrderTimeline orderId={order.id} apiClient={api} urlPrefix="/customer" />
            </div>

            {/* Items list */}
            <div className="bg-white rounded-2xl p-4 mt-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
              <h3 className="font-bold text-[14px] text-[#1A0000] mb-3">
                Produk ({order.items?.length || 0})
              </h3>
              <OrderItemsList items={order.items} orderStatus={order.status} />
            </div>

            {/* Totals breakdown */}
            <div className="bg-white rounded-2xl p-4 mt-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
              <h3 className="font-bold text-[14px] text-[#1A0000] mb-3">Rincian Pembayaran</h3>
              <div className="space-y-2 text-[13px]">
                {(() => {
                  const promoTotal = (order.items || []).reduce(
                    (s, i) => s + (Number(i.discount) || 0), 0
                  );
                  const baseSubtotal = (order.items || []).reduce(
                    (s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0
                  );
                  return (
                    <>
                      <Money label="Subtotal Barang" value={baseSubtotal} />
                      {promoTotal > 0 && (
                        <Money label="Diskon Promo Produk" value={-Math.abs(promoTotal)} />
                      )}
                      {Math.abs(order.discount || 0) > 0 && (
                        <Money label="Diskon Voucher" value={-Math.abs(order.discount)} />
                      )}
                    </>
                  );
                })()}
                <Money label="Pengiriman" value={order.deliveryFee} />
                <Money label="Biaya Admin" value={order.adminFee} />
                <div className="border-t border-dashed border-gray-200 mt-2 pt-2 flex justify-between font-bold text-[15px]">
                  <span>Total</span>
                  <span className="text-[#B20605]">{rupiah(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Selesaikan Pesanan — saat status Tiba */}
            {order.status === "Tiba" && (
              <button
                onClick={confirmReceipt}
                disabled={confirming}
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-lg disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-[14px]">
                    {confirming ? "Memproses..." : "Selesaikan Pesanan"}
                  </div>
                  <div className="text-[11px] opacity-90">Konfirmasi barang sudah diterima</div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Beri / Edit Ulasan — saat status Selesai */}
            {order.status === "Selesai" && (
              <button
                onClick={() => navigate(`/review/${order.id}`)}
                className="w-full mt-4 bg-white border border-yellow-200 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
              >
                <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center text-lg">
                  ⭐
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-[14px] text-[#1A0000]">
                    {hasReview ? "Edit Ulasan" : "Beri Ulasan"}
                  </div>
                  <div className="text-[11px] text-[#606060]">
                    {hasReview ? "Anda sudah memberi ulasan untuk pesanan ini" : "Bagikan pengalaman Anda"}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            )}

            {/* Return request button — only if status Selesai & within 7 days */}
            {order.status === "Selesai" && (() => {
              const updatedAt = order.updatedAt ? new Date(order.updatedAt) : null;
              const daysSince = updatedAt ? (Date.now() - updatedAt.getTime()) / 86400000 : 999;
              return daysSince <= 7 ? (
                <button
                  onClick={() => navigate(`/return/new/${order.id}`)}
                  className="w-full mt-4 bg-white border border-orange-200 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    ↩
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-[14px] text-[#1A0000]">Ajukan Pengembalian</div>
                    <div className="text-[11px] text-[#606060]">Window {Math.max(0, Math.ceil(7 - daysSince))} hari lagi</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ) : null;
            })()}

            {/* Invoice button */}
            <button
              onClick={() => navigate(`/invoice/${order.id}`)}
              className="w-full mt-4 bg-white border border-[#F6F3F3] rounded-2xl px-4 py-4 flex items-center gap-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[#FFF5F5] text-[#B20605] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-[14px] text-[#1A0000]">
                  Lihat {["Diproses","Diproses Sebagian","Dikirim","Selesai","Selesai Sebagian"].includes(order.status) ? "Invoice" : "Proforma Invoice"}
                </div>
                <div className="text-[11px] text-[#606060]">PDF / Print</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </>
        )}
      </div>

      <div className="px-5 mt-5">
        <button
          onClick={() => navigate("/orders", { replace: true })}
          className="w-full bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/20"
        >
          Lihat Semua Pesanan
        </button>
        <button
          onClick={() => navigate("/", { replace: true })}
          className="w-full text-[#B20605] font-semibold py-3 mt-2 flex items-center justify-center gap-2"
        >
          <HomeIcon className="w-4 h-4" /> Kembali ke Beranda
        </button>
      </div>

      {order && <OrderChat orderId={order.id} mode="customer" currentUserType="customer" />}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-[#606060] text-[13px]">{label}</span>
      <span className="text-[#1A0000] text-[13px]">{value}</span>
    </div>
  );
}

function Money({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#606060]">{label}</span>
      <span className={value < 0 ? "text-green-600" : "text-[#1A0000]"}>
        {value < 0 ? "- " : ""}
        {rupiah(Math.abs(value || 0))}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-dashed border-gray-100" />;
}

// Heading + ikon + warna sesuai status order
function statusVisual(status) {
  switch (status) {
    case "Menunggu Konfirmasi":
      return {
        Icon: Clock, color: "text-amber-600", bg: "bg-amber-100",
        heading: "Pesanan Dibuat",
        message: "Pesanan Anda menunggu konfirmasi sales. Anda akan dihubungi segera.",
      };
    case "Diproses Sales":
      return {
        Icon: UserCheck, color: "text-blue-600", bg: "bg-blue-100",
        heading: "Disetujui Sales",
        message: "Pesanan disetujui sales & menunggu pemrosesan Admin SO.",
      };
    case "Diproses":
      return {
        Icon: Package, color: "text-amber-600", bg: "bg-amber-100",
        heading: "Sedang Disiapkan",
        message: "Pesanan sedang disiapkan & dikemas di gudang.",
      };
    case "Diproses Sebagian":
      return {
        Icon: Package, color: "text-amber-600", bg: "bg-amber-100",
        heading: "Sebagian Sedang Disiapkan",
        message: "Beberapa item sudah siap kirim, sisanya masih disiapkan.",
      };
    case "Dikirim":
      return {
        Icon: Truck, color: "text-orange-600", bg: "bg-orange-100",
        heading: "Pesanan Dikirim",
        message: "Barang sedang dalam pengiriman ke alamat Anda.",
      };
    case "Selesai Sebagian":
      return {
        Icon: Truck, color: "text-emerald-600", bg: "bg-emerald-100",
        heading: "Sebagian Pesanan Diterima",
        message: "Sebagian item sudah diterima, sisanya akan menyusul.",
      };
    case "Tiba":
      return {
        Icon: Truck, color: "text-cyan-600", bg: "bg-cyan-100",
        heading: "Pesanan Tiba",
        message: "Barang sudah diantar ke alamat Anda. Mohon konfirmasi penerimaan.",
      };
    case "Selesai":
      return {
        Icon: PartyPopper, color: "text-green-600", bg: "bg-green-100",
        heading: "Pesanan Selesai",
        message: "Pesanan sudah Anda terima. Terima kasih telah berbelanja!",
      };
    case "Dibatalkan":
      return {
        Icon: XCircle, color: "text-red-600", bg: "bg-red-100",
        heading: "Pesanan Dibatalkan",
        message: "Pesanan ini telah dibatalkan.",
      };
    case "Diretur":
      return {
        Icon: RotateCcw, color: "text-purple-600", bg: "bg-purple-100",
        heading: "Pesanan Diretur",
        message: "Pengembalian sudah diproses.",
      };
    default:
      return {
        Icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100",
        heading: "Pesanan Berhasil!",
        message: "Pesanan Anda sedang diproses. Anda akan dihubungi segera.",
      };
  }
}
