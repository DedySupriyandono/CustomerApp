import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Home as HomeIcon, FileText, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";
import salesApi from "../../api/salesApi";
import { rupiah } from "../../utils/format";
import OrderItemsList from "../../components/OrderItemsList";
import OrderChat from "../../components/OrderChat";
import OrderTimeline from "../../components/OrderTimeline";

export default function SalesOrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const loadOrder = () => {
    setLoading(true);
    salesApi
      .get(`/sales/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(loadOrder, [id]);

  // "Selesaikan Pesanan" — POST /sales/orders/{id}/complete
  // (sama dgn SalesTransactions). Item masuk ke sales_stock_values.
  const completeOrder = async () => {
    if (completing) return;
    const c = await Swal.fire({
      title: "Selesaikan Pesanan?",
      html: `Pesanan <b>${order.orderNumber}</b> akan ditandai <b>Selesai</b><br>` +
            `dan item-itemnya masuk ke <b>Stock Anda</b>.<br>` +
            `<span class="text-gray-500" style="font-size:11px">Anda bisa langsung jual lewat menu Scan.</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Selesaikan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#1F7A4D",
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
    });
    if (!c.isConfirmed) return;
    setCompleting(true);
    Swal.fire({
      title: "Memproses…",
      allowOutsideClick: false, allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      const r = await salesApi.post(`/sales/orders/${order.id}/complete`);
      Swal.close();
      if (r.data?.success) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil!",
          html: `${r.data.message || "Pesanan diselesaikan."}` +
                (r.data.snInserted ? `<br><b>${r.data.snInserted} item</b> masuk ke stock.` : ""),
          confirmButtonColor: "#1F7A4D",
        });
        loadOrder();
      } else {
        await Swal.fire({ icon: "error", title: "Gagal", text: r.data?.message || "Gagal menyelesaikan pesanan." });
      }
    } catch (err) {
      Swal.close();
      await Swal.fire({
        icon: "error", title: "Gagal",
        text: err.response?.data?.message || err.message || "Server error",
      });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      className="mobile-container min-h-screen flex flex-col pb-10"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="bg-gradient-to-b from-[#FFF5F5] via-white to-[#FBF9F9] pt-12 pb-6 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <CheckCircle2 className="w-12 h-12 text-green-600" strokeWidth={2.5} />
        </div>
        <h1 className="text-[22px] font-bold text-[#1A0000]">Pesanan Berhasil!</h1>
        <p className="text-[#606060] text-[13px] mt-1.5">Order Anda tersimpan & menunggu konfirmasi.</p>
      </div>

      <div className="flex-1 px-5">
        {loading && <div className="text-center text-gray-400 py-8 text-sm">Memuat...</div>}
        {!loading && order && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
              <Row label="No. Pesanan" value={<span className="font-bold">{order.orderNumber}</span>} />
              <Row label="Status" value={<span className="bg-[#FFF0E6] text-[#E87B1E] px-3 py-1 rounded-full text-[11px] font-semibold">{order.status}</span>} />
              <Row label="Tanggal" value={new Date(order.createdAt).toLocaleString("id-ID")} />
              <Row label="Total" value={<span className="text-[#B20605] font-bold text-[16px]">{rupiah(order.total)}</span>} />
            </div>

            <div className="bg-white rounded-2xl p-4 mt-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
              <h3 className="font-bold text-[14px] text-[#1A0000] mb-3">Produk ({order.items?.length || 0})</h3>
              <OrderItemsList items={order.items} orderStatus={order.status} />
            </div>

            {/* Riwayat Pesanan — sama komponen seperti customer side,
                hanya urlPrefix beda (/sales). */}
            <div className="mt-4">
              <OrderTimeline orderId={order.id} apiClient={salesApi} urlPrefix="/sales" />
            </div>

            {/* Selesaikan Pesanan — saat status Dikirim */}
            {order.status === "Dikirim" && (
              <button
                onClick={completeOrder}
                disabled={completing}
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl px-4 py-4 flex items-center justify-center gap-3 shadow-lg shadow-green-900/20 disabled:opacity-60"
              >
                <CheckCircle2 className="w-5 h-5" />
                <div className="font-bold text-[14px]">
                  {completing ? "Memproses..." : "Selesaikan Pesanan"}
                </div>
              </button>
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
                  Lihat {order && ["Diproses","Diproses Sebagian","Dikirim","Selesai","Selesai Sebagian"].includes(order.status) ? "Invoice" : "Proforma Invoice"}
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
          onClick={() => navigate("/sales/transactions", { replace: true })}
          className="w-full bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/20"
        >
          Lihat Transaksi Saya
        </button>
        <button
          onClick={() => navigate("/sales", { replace: true })}
          className="w-full text-[#B20605] font-semibold py-3 mt-2 flex items-center justify-center gap-2"
        >
          <HomeIcon className="w-4 h-4" /> Kembali ke Beranda
        </button>
      </div>

      {order && <OrderChat orderId={order.id} mode="sales" currentUserType="sales" orderStatus={order.status} />}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100 last:border-0">
      <span className="text-[#606060] text-[13px]">{label}</span>
      <span className="text-[#1A0000] text-[13px]">{value}</span>
    </div>
  );
}
