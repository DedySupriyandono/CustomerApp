import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Bell,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../api/api";
import BottomNav from "../components/BottomNav";
import { useCart } from "../contexts/CartContext";
import { rupiah } from "../utils/format";

// Transaksi aktif saja — order final (Selesai + Dibatalkan) ada di /reports.
// FLOW BARU (sejak customer order langsung ke Admin SO, skip sales approval):
//   Menunggu Konfirmasi → Diproses Admin → Dipicking → Dikirim → Selesai
// Tab "Diproses Sales" di-hapus karena stage itu tidak ada lagi di flow baru.
const STATUS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "Menunggu Konfirmasi", label: "Menunggu Konfirmasi" },
  { value: "Diproses Admin", label: "Diproses Admin" },
  { value: "Dipicking", label: "Dipicking" },
  { value: "Dikirim", label: "Dikirim" },
];

// Status yang dianggap sudah final & masuk Laporan, tidak tampil di Transaksi.
const HISTORY_STATUSES = "Selesai,Dibatalkan";

const PAGE_SIZE = 10;

export default function MyOrders() {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [finishingId, setFinishingId] = useState(0);

  // Tombol "Selesai" → POST /customer/receive/confirm.
  // Anti double-click via finishingId state.
  const finishOrder = async (orderId) => {
    if (finishingId) return;
    const confirm = await Swal.fire({
      icon: "question",
      title: "Selesaikan Pesanan?",
      text: "Konfirmasi semua barang sudah diterima dengan baik.",
      showCancelButton: true,
      confirmButtonText: "Ya, terima",
      cancelButtonText: "Batal",
      confirmButtonColor: "#1F7A4D",
      cancelButtonColor: "#6c757d",
    });
    if (!confirm.isConfirmed) return;
    setFinishingId(orderId);
    Swal.fire({
      title: "Memproses…",
      text: "Barang sedang masuk ke stok Anda.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      const r = await api.post("/customer/receive/confirm", { orderId });
      Swal.close();
      if (r.data?.success) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: r.data.message || "Pesanan diselesaikan.",
          confirmButtonColor: "#1F7A4D",
        });
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "Selesai" } : o))
        );
      } else {
        Swal.fire({
          icon: "warning",
          title: "Gagal",
          text: r.data?.message || "Gagal selesaikan pesanan.",
          confirmButtonColor: "#B20605",
        });
      }
    } catch (e) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: e.response?.data?.message || "Tidak bisa hubungi server.",
        confirmButtonColor: "#B20605",
      });
    } finally {
      setFinishingId(0);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/customer/orders", {
        params: {
          status: status || undefined,
          // Selalu exclude status final supaya halaman Transaksi tidak overlap
          // dgn halaman Laporan. Berlaku juga saat tab "Semua".
          excludeStatus: HISTORY_STATUSES,
          search: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
      })
      .then((r) => {
        // Tolerate both old (array) and new (envelope) response shapes.
        if (Array.isArray(r.data)) {
          setOrders(r.data);
          setTotalPages(1);
          setTotalRecords(r.data.length);
        } else {
          setOrders(r.data?.data || []);
          setTotalPages(r.data?.totalPages || 0);
          setTotalRecords(r.data?.totalRecords || 0);
        }
      })
      .catch((e) => {
        console.error("[MyOrders]", e);
        setError(e.response?.data?.message || e.message || "Gagal memuat transaksi");
      })
      .finally(() => setLoading(false));
  }, [status, search, page]);

  const applySearch = (e) => {
    e?.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const changeStatus = (newStatus) => {
    setPage(1);
    setStatus(newStatus);
  };

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
            <h1 className="text-white text-base font-bold leading-[26px]">Transaksi Pembelian</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/notifications")} aria-label="Notifikasi" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative">
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
          {/* Search */}
          <form onSubmit={applySearch} role="search" className="w-full">
            <label className="relative flex w-full h-12 bg-white rounded-[10px] border border-[#F6F3F3]">
              <span className="sr-only">Cari no. order</span>
              <div className="absolute top-1/2 -translate-y-1/2 left-1 bg-[#FFF5F5] p-[7px] rounded-lg">
                <Search className="w-[18px] h-[18px] text-[#B20605]" />
              </div>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={applySearch}
                placeholder="Cari no. order..."
                className="absolute inset-0 pl-[52px] pr-3 text-sm text-[#1A0000] placeholder:text-[#606060] focus:outline-none rounded-[10px] bg-transparent"
              />
            </label>
          </form>

          {/* Status chips — horizontal swipe-able. Pakai snap-x untuk
              ngunci ke chip terdekat saat di-flick di mobile. -mr-5 + pr-5
              supaya chip terakhir tidak ke-clip oleh padding container. */}
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide mt-4 -mx-1 px-1 -mr-5 pr-5 snap-x"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {STATUS_OPTIONS.map((opt) => {
              const active = status === opt.value;
              return (
                <button
                  key={opt.value || "all"}
                  onClick={() => changeStatus(opt.value)}
                  className={`shrink-0 snap-start px-4 py-2 rounded-full text-[12px] font-semibold border whitespace-nowrap ${
                    active
                      ? "bg-[#B20605] text-white border-[#B20605]"
                      : "bg-white text-[#1A0000] border-[#F6F3F3]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Result meta */}
          {!loading && !error && (
            <div className="text-[11px] text-gray-500 mt-3">
              {totalRecords} transaksi {status && `· Status: ${status}`} {search && `· "${search}"`}
            </div>
          )}

          {/* List */}
          <div className="mt-3 space-y-3">
            {loading && (
              <div className="text-center text-gray-400 py-12 text-sm">Memuat transaksi...</div>
            )}
            {!loading && error && (
              <div className="text-center text-red-600 py-12 text-sm">{error}</div>
            )}
            {!loading && !error && orders.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-[#F6F3F3]">
                Belum ada transaksi
              </div>
            )}

            {!loading &&
              orders.map((o) => {
                const isShipped = o.status === "Dikirim";
                const chipStyle = isShipped
                  ? "bg-[#E6F4EA] text-[#1F7A4D]"
                  : "bg-[#FFF0E6] text-[#E87B1E]";
                return (
                  <div
                    key={o.id}
                    className="w-full bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3]"
                  >
                    <button
                      onClick={() => navigate(`/success/${o.id}`)}
                      className="w-full text-left"
                    >
                      <div className="flex justify-between items-start pb-3 border-b border-gray-100 border-dashed mb-3">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-[#1A0000] text-[15px] truncate">
                            {o.orderNumber}
                          </p>
                          <p className="text-gray-400 text-[11px] mt-0.5">
                            {new Date(o.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className={`${chipStyle} px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0`}>
                          {o.status}
                        </div>
                      </div>

                      <div className="space-y-2 text-[13px]">
                        <Row label="Jumlah Produk" value={`${o.items.length} produk`} />
                        <Row
                          label="Total Item"
                          value={`${o.items.reduce((s, i) => s + i.quantity, 0)} pcs`}
                        />
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-gray-500">Total</span>
                          <span className="text-[#B20605] font-bold text-[15px]">
                            {rupiah(o.total)}
                          </span>
                        </div>
                      </div>
                    </button>

                    {isShipped && (
                      <button
                        onClick={() => finishOrder(o.id)}
                        disabled={finishingId === o.id}
                        className="mt-3 w-full bg-[#1F7A4D] hover:bg-[#175e3a] disabled:opacity-60 text-white text-[13px] font-semibold py-2.5 rounded-xl transition"
                      >
                        {finishingId === o.id ? "Memproses…" : "Selesai"}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5 mb-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous"
                className="w-9 h-9 rounded-full bg-white border border-[#F6F3F3] flex items-center justify-center disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 text-[#1A0000]" />
              </button>

              {buildPageNumbers(page, totalPages).map((p, idx) =>
                p === "…" ? (
                  <span key={`gap-${idx}`} className="text-gray-400 text-sm px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[36px] h-9 px-3 rounded-full text-sm font-semibold ${
                      p === page
                        ? "bg-[#B20605] text-white"
                        : "bg-white text-[#1A0000] border border-[#F6F3F3]"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next"
                className="w-9 h-9 rounded-full bg-white border border-[#F6F3F3] flex items-center justify-center disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4 text-[#1A0000]" />
              </button>
            </div>
          )}
        </section>
      </div>

      <BottomNav />
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

// Returns array like [1, "…", 4, 5, 6, "…", 12]
function buildPageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}
