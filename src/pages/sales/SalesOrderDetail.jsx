import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  User as UserIcon,
  Phone,
  MapPin,
  CheckCircle2,
  FileText,
  ChevronRight,
} from "lucide-react";
import salesApi from "../../api/salesApi";
import { rupiah } from "../../utils/format";
import BottomSheet from "../../components/BottomSheet";
import OrderItemsList from "../../components/OrderItemsList";
import OrderChat from "../../components/OrderChat";
import OrderTimeline from "../../components/OrderTimeline";
import { StatusBadge } from "./SalesOrders";

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState(""); // approve | reject | complete
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    salesApi
      .get(`/sales/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch((e) => setError(e.response?.data?.message || "Gagal memuat pesanan"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const doApprove = async () => {
    setAction("approve");
    try {
      await salesApi.post(`/sales/orders/${id}/approve`);
      load();
    } catch (e) {
      const data = e.response?.data || {};
      console.error("[Approve] error:", data);
      const msg = data.message || e.message || "Gagal approve";
      const detail = data.detail ? `\n\nDetail:\n${data.detail}` : "";
      alert(`${msg}${detail}`);
    } finally {
      setAction("");
    }
  };

  const doDeleteItem = async (itemId, item) => {
    if (!itemId) return;
    if (!window.confirm(`Hapus "${item?.productName || "item ini"}" dari pesanan?\n\nStok akan dikembalikan.`)) return;
    setDeletingId(itemId);
    try {
      await salesApi.delete(`/sales/orders/${id}/items/${itemId}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Gagal menghapus item");
    } finally {
      setDeletingId(null);
    }
  };

  const doReject = async () => {
    if (!rejectReason.trim()) {
      alert("Masukkan alasan penolakan");
      return;
    }
    setAction("reject");
    try {
      await salesApi.post(`/sales/orders/${id}/reject`, { reason: rejectReason });
      setRejectOpen(false);
      setRejectReason("");
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Gagal reject");
    } finally {
      setAction("");
    }
  };

  if (loading) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen text-gray-400">
        Memuat...
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen text-red-600 p-6 text-center">
        {error || "Pesanan tidak ditemukan"}
      </div>
    );
  }

  // Aksi sales hanya saat order masih menunggu — setelah approve, lanjut ke Admin SO
  const canApprove = order.status === "Menunggu Konfirmasi";
  const canReject = order.status === "Menunggu Konfirmasi";
  const waitingAdminSo = order.status === "Diproses Sales";

  return (
    <div
      className="mobile-container relative shadow-2xl pb-32"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b from-[#1A0000] via-[#350000] to-[#540101] z-0" />

      <div className="relative z-10">
        <header className="flex items-center justify-between px-5 pt-12 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-base font-bold">Detail Pesanan</h1>
          </div>
        </header>

        <section className="bg-[#FBF9F9] rounded-t-[20px] -mt-2 min-h-[calc(100vh-180px)] px-5 pt-[18px]">
          {/* Order summary */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
            <div className="flex justify-between items-start pb-3 border-b border-gray-100 border-dashed mb-3">
              <div>
                <p className="font-bold text-[#1A0000] text-[16px]">{order.orderNumber}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(order.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <Row label="Pengiriman" value={order.deliveryMethod || "—"} />
            <Row label="Pembayaran" value={order.paymentMethod || "—"} />
            {order.voucherCode && <Row label="Voucher" value={order.voucherCode} />}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
              <span className="text-gray-500 text-[13px]">Total</span>
              <span className="text-[#B20605] font-bold text-[16px]">{rupiah(order.total)}</span>
            </div>
          </div>

          {/* Customer */}
          {order.customer && (
            <div className="bg-white rounded-2xl p-4 mt-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
              <h3 className="font-bold text-[14px] text-[#1A0000] mb-3">Customer</h3>
              <CustomerRow icon={<UserIcon className="w-4 h-4" />} text={order.customer.customerName} />
              {order.customer.customerCode && (
                <CustomerRow text={`Kode: ${order.customer.customerCode}`} />
              )}
              {order.customer.phone && (
                <CustomerRow icon={<Phone className="w-4 h-4" />} text={order.customer.phone} link={`tel:${order.customer.phone}`} />
              )}
              {order.customer.address && (
                <CustomerRow icon={<MapPin className="w-4 h-4" />} text={order.customer.address} />
              )}
              {(order.customer.branch || order.customer.regional) && (
                <CustomerRow
                  text={[order.customer.branch, order.customer.regional].filter(Boolean).join(" · ")}
                />
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="mt-4">
            <OrderTimeline orderId={order.id} apiClient={salesApi} urlPrefix="/sales" />
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl p-4 mt-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
            <h3 className="font-bold text-[14px] text-[#1A0000] mb-3">
              Produk ({order.items?.length || 0})
            </h3>
            <OrderItemsList
              items={order.items}
              orderStatus={order.status}
              onDelete={canApprove && (order.items?.length || 0) > 1 ? doDeleteItem : null}
              deletingId={deletingId}
            />
            {canApprove && (order.items?.length || 0) > 1 && (
              <p className="text-[11px] text-gray-400 mt-2">
                Tap ikon <span className="text-red-500">🗑</span> untuk menghapus item sebelum approve.
              </p>
            )}
          </div>

          {/* Totals */}
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
                <span>TOTAL</span>
                <span className="text-[#B20605]">{rupiah(order.total)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-[#FFF5F5] border border-[#FECECE] rounded-2xl p-4 mt-4">
              <div className="text-[11px] uppercase tracking-wider text-[#606060] mb-1">Catatan</div>
              <div className="text-[13px] text-[#1A0000] whitespace-pre-wrap">{order.notes}</div>
            </div>
          )}

          <button
            onClick={() => navigate(`/sales/invoice/${order.id}`)}
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
        </section>
      </div>

      {/* Bottom action bar — hanya tampil saat masih ada aksi yang relevan */}
      {(canReject || canApprove || waitingAdminSo) && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2 z-40">
          {canReject && (
            <button
              onClick={() => setRejectOpen(true)}
              disabled={!!action}
              className="flex-1 border-2 border-red-300 text-red-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <X className="w-4 h-4" /> Tolak
            </button>
          )}
          {canApprove && (
            <button
              onClick={doApprove}
              disabled={action === "approve"}
              className="flex-1 bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-900/20"
            >
              <Check className="w-4 h-4" />
              {action === "approve" ? "Memproses..." : "Approve"}
            </button>
          )}
          {waitingAdminSo && (
            <div className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-50 border border-blue-200">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 text-[12px] font-semibold text-center">
                Sudah di-approve — menunggu Admin SO
              </span>
            </div>
          )}
        </div>
      )}

      {/* Reject reason sheet */}
      <BottomSheet open={rejectOpen} onClose={() => setRejectOpen(false)} title="Tolak Pesanan">
        <p className="text-[13px] text-[#606060] mb-3">
          Berikan alasan penolakan. Pesan akan disimpan di catatan pesanan.
        </p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value.slice(0, 200))}
          rows={3}
          placeholder="Alasan penolakan..."
          className="w-full bg-[#FBF9F9] rounded-xl p-3 text-sm border border-[#F6F3F3] focus:outline-none focus:border-[#B20605] resize-none"
        />
        <div className="text-right text-xs text-gray-400 mt-1 mb-2">{rejectReason.length}/200</div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setRejectOpen(false)}
            className="flex-1 py-3 rounded-xl border border-[#F6F3F3] text-[#606060] font-semibold"
          >
            Batal
          </button>
          <button
            onClick={doReject}
            disabled={action === "reject" || !rejectReason.trim()}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50"
          >
            {action === "reject" ? "Memproses..." : "Tolak Pesanan"}
          </button>
        </div>
      </BottomSheet>

      {order && <OrderChat orderId={order.id} mode="sales" currentUserType="sales" orderStatus={order.status} />}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-500 text-[13px]">{label}</span>
      <span className="text-[#1A0000] text-[13px] font-medium">{value}</span>
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

function CustomerRow({ icon, text, link }) {
  if (!text) return null;
  const inner = (
    <>
      {icon && (
        <div className="w-7 h-7 rounded-lg bg-[#FFF5F5] text-[#B20605] flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <span className="text-[13px] text-[#1A0000]">{text}</span>
    </>
  );
  return (
    <div className="flex items-center gap-3 py-2 border-t border-[#F6F3F3] first:border-t-0">
      {link ? (
        <a href={link} className="flex items-center gap-3 w-full">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}
