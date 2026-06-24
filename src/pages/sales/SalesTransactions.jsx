import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import salesApi from "../../api/salesApi";
import SalesBottomNav from "../../components/SalesBottomNav";
import { useSalesCart } from "../../contexts/SalesCartContext";
import { rupiah } from "../../utils/format";

// Urutan flow status (sama dgn customer MyOrders):
//   Menunggu Konfirmasi → Diproses Sales → Diproses Admin → Dipicking → Dikirim → Selesai
const STATUS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "Menunggu Konfirmasi", label: "Menunggu Konfirmasi" },
  { value: "Diproses Sales", label: "Diproses Sales" },
  { value: "Diproses Admin", label: "Diproses Admin" },
  { value: "Dipicking", label: "Dipicking" },
  { value: "Dikirim", label: "Dikirim" },
  { value: "Selesai", label: "Selesai" },
  { value: "Dibatalkan", label: "Dibatalkan" },
];

const PAGE_SIZE = 10;

export default function SalesTransactions() {
  const navigate = useNavigate();
  const { totalItems } = useSalesCart();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState(null);

  const reload = () => {
    setLoading(true);
    setError("");
    salesApi
      .get("/sales/orders/mine", {
        params: { status: status || undefined, search: search || undefined, page, pageSize: PAGE_SIZE },
      })
      .then((r) => {
        setOrders(r.data?.data || []);
        setTotalPages(r.data?.totalPages || 0);
        setTotalRecords(r.data?.totalRecords || 0);
      })
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, [status, search, page]);

  // Tap "Selesai" → konfirmasi via SweetAlert + POST /complete →
  // SN masuk sales_stock_values.
  const completeOrder = async (e, order) => {
    e.stopPropagation();
    if (completingId) return;

    const confirm = await Swal.fire({
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
    if (!confirm.isConfirmed) return;

    setCompletingId(order.id);
    Swal.fire({
      title: "Memproses...",
      allowOutsideClick: false,
      allowEscapeKey: false,
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
        reload();
      } else {
        await Swal.fire({
          icon: "error",
          title: "Gagal",
          text: r.data?.message || "Gagal menyelesaikan pesanan.",
        });
      }
    } catch (err) {
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Server Error",
        text: err.response?.data?.message || err.message || "Gagal.",
      });
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div
      className="mobile-container relative shadow-2xl pb-28"
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
            <h1 className="text-white text-base font-bold">Transaksi Saya</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/sales/notifications")}
              aria-label="Notifikasi"
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>
            <button
              onClick={() => navigate("/sales/checkout")}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative"
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <label className="relative flex w-full h-12 bg-white rounded-[10px] border border-[#F6F3F3]">
              <div className="absolute top-1/2 -translate-y-1/2 left-1 bg-[#FFF5F5] p-[7px] rounded-lg">
                <Search className="w-[18px] h-[18px] text-[#B20605]" />
              </div>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={() => {
                  setPage(1);
                  setSearch(searchInput.trim());
                }}
                placeholder="Cari no. order..."
                className="absolute inset-0 pl-[52px] pr-3 text-sm text-[#1A0000] placeholder:text-[#606060] focus:outline-none rounded-[10px] bg-transparent"
              />
            </label>
          </form>

          {/* Tab chips horizontal-swipe-able — sama pattern dgn customer
              MyOrders supaya UX konsisten antara dua portal. */}
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide mt-4 -mx-1 px-1 -mr-5 pr-5 snap-x"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {STATUS_OPTIONS.map((opt) => {
              const active = status === opt.value;
              return (
                <button
                  key={opt.value || "all"}
                  onClick={() => {
                    setPage(1);
                    setStatus(opt.value);
                  }}
                  className={`shrink-0 snap-start px-4 py-2 rounded-full text-[12px] font-semibold border whitespace-nowrap ${
                    active ? "bg-[#B20605] text-white border-[#B20605]" : "bg-white text-[#1A0000] border-[#F6F3F3]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {!loading && !error && (
            <div className="text-[11px] text-gray-500 mt-3">{totalRecords} transaksi</div>
          )}

          <div className="mt-3 space-y-3">
            {loading && <div className="text-center text-gray-400 py-12 text-sm">Memuat...</div>}
            {!loading && error && <div className="text-center text-red-600 py-12 text-sm">{error}</div>}
            {!loading && !error && orders.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-[#F6F3F3]">
                Belum ada transaksi
              </div>
            )}

            {!loading &&
              orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => navigate(`/sales/transactions/${o.id}`)}
                  className="w-full bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] text-left cursor-pointer"
                >
                  <div className="flex justify-between items-start pb-3 border-b border-gray-100 border-dashed mb-3">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-[#1A0000] text-[15px] truncate">{o.orderNumber}</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        {new Date(o.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="bg-[#FFF0E6] text-[#E87B1E] px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0">
                      {o.status}
                    </div>
                  </div>
                  <div className="space-y-2 text-[13px]">
                    <Row label="Jumlah Produk" value={`${o.itemCount} produk`} />
                    <Row label="Total Item" value={`${o.totalQuantity} pcs`} />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-gray-500">Total</span>
                      <span className="text-[#B20605] font-bold text-[15px]">{rupiah(o.total)}</span>
                    </div>
                  </div>

                  {/* Tombol Selesai utk status Dikirim — barang sudah sampai,
                      sales konfirmasi terima → SN masuk ke sales_stock_values
                      dan bisa langsung dijual via menu Scan. */}
                  {o.status === "Dikirim" && (
                    <button
                      onClick={(e) => completeOrder(e, o)}
                      disabled={completingId === o.id}
                      className="w-full mt-3 py-2.5 rounded-xl text-[13px] font-semibold bg-[#1F7A4D] hover:bg-[#175e3a] disabled:bg-gray-300 text-white flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {completingId === o.id ? "Memproses..." : "Selesai — Masukkan ke Stock"}
                    </button>
                  )}
                </div>
              ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5 mb-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-9 h-9 rounded-full bg-white border border-[#F6F3F3] flex items-center justify-center disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 text-[#1A0000]" />
              </button>
              <span className="text-sm text-gray-500">
                Page <b>{page}</b> / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-9 h-9 rounded-full bg-white border border-[#F6F3F3] flex items-center justify-center disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4 text-[#1A0000]" />
              </button>
            </div>
          )}
        </section>
      </div>

      <SalesBottomNav />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="text-[#1A0000] font-semibold">{value}</span>
    </div>
  );
}
