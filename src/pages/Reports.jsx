import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bell, ShoppingCart, Search,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
} from "lucide-react";
import api from "../api/api";
import BottomNav from "../components/BottomNav";
import { useCart } from "../contexts/CartContext";
import { rupiah } from "../utils/format";

// Laporan transaksi customer: hanya status final (Selesai + Dibatalkan).
// Backend support CSV status → 1 request bisa fetch dua-duanya.
//
// Tab Semua = "Selesai,Dibatalkan", Selesai = "Selesai", Dibatalkan = "Dibatalkan".

const STATUS_TABS = [
  { value: "Selesai,Dibatalkan", label: "Semua" },
  { value: "Selesai", label: "Selesai" },
  { value: "Dibatalkan", label: "Dibatalkan" },
];

const PAGE_SIZE = 10;

export default function Reports() {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [status, setStatus] = useState("Selesai,Dibatalkan");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/customer/orders", {
        params: { status, search: search || undefined, page, pageSize: PAGE_SIZE },
      })
      .then((r) => {
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
      .catch((e) => setError(e.response?.data?.message || e.message || "Gagal memuat laporan"))
      .finally(() => setLoading(false));
  }, [status, search, page]);

  // Summary dihitung dari orders yg ke-load di page ini. Total record-nya
  // akurat dari backend (totalRecords), tapi nominal jumlahnya hanya page ini.
  const summary = useMemo(() => {
    let done = 0, cancelled = 0, totalDone = 0;
    orders.forEach((o) => {
      if (o.status === "Selesai") { done++; totalDone += Number(o.total || 0); }
      else if (o.status === "Dibatalkan") { cancelled++; }
    });
    return { done, cancelled, totalDone };
  }, [orders]);

  const applySearch = (e) => {
    e?.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const changeStatus = (v) => { setPage(1); setStatus(v); };

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
            <h1 className="text-white text-base font-bold leading-[26px]">Laporan</h1>
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
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-3 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1F7A4D]" /> Selesai
              </div>
              <div className="text-[18px] font-bold text-[#1A0000] mt-1">{summary.done}</div>
              <div className="text-[11px] text-[#B20605] font-semibold mt-0.5 truncate">
                {rupiah(summary.totalDone)}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <XCircle className="w-3.5 h-3.5 text-[#B20605]" /> Dibatalkan
              </div>
              <div className="text-[18px] font-bold text-[#1A0000] mt-1">{summary.cancelled}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Pesanan</div>
            </div>
          </div>

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

          {/* Tabs */}
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide mt-4 -mx-1 px-1 snap-x"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {STATUS_TABS.map((opt) => {
              const active = status === opt.value;
              return (
                <button
                  key={opt.value}
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
              {totalRecords} transaksi {search && `· "${search}"`}
            </div>
          )}

          {/* List */}
          <div className="mt-3 space-y-3">
            {loading && (
              <div className="text-center text-gray-400 py-12 text-sm">Memuat laporan...</div>
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
                const isDone = o.status === "Selesai";
                const chipStyle = isDone
                  ? "bg-[#E6F4EA] text-[#1F7A4D]"
                  : "bg-[#FFE6E6] text-[#B20605]";
                return (
                  <button
                    key={o.id}
                    onClick={() => navigate(`/success/${o.id}`)}
                    className="w-full bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] text-left"
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
                        <span className={`font-bold text-[15px] ${isDone ? "text-[#B20605]" : "text-gray-400 line-through"}`}>
                          {rupiah(o.total)}
                        </span>
                      </div>
                    </div>
                  </button>
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
                  <span key={`gap-${idx}`} className="text-gray-400 text-sm px-1">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[36px] h-9 px-3 rounded-full text-sm font-semibold ${
                      p === page ? "bg-[#B20605] text-white" : "bg-white text-[#1A0000] border border-[#F6F3F3]"
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

function buildPageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}
