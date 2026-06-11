import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
} from "lucide-react";
import salesApi from "../../api/salesApi";
import { useSalesAuth } from "../../contexts/SalesAuthContext";
import { useSalesCart } from "../../contexts/SalesCartContext";
import SalesBottomNav from "../../components/SalesBottomNav";
import { rupiah } from "../../utils/format";

const STATUS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "Menunggu Konfirmasi", label: "Menunggu" },
  { value: "Diproses Sales", label: "Diproses" },
  { value: "Selesai", label: "Selesai" },
  { value: "Dibatalkan", label: "Batal" },
];

const PAGE_SIZE = 10;

export default function SalesOrders() {
  const navigate = useNavigate();
  const { sales, logout } = useSalesAuth();
  const { totalItems } = useSalesCart();

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [status, setStatus] = useState("Menunggu Konfirmasi");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    salesApi
      .get("/sales/orders", {
        params: {
          status: status || undefined,
          search: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
      })
      .then((r) => {
        setOrders(r.data?.data || []);
        setTotalPages(r.data?.totalPages || 0);
        setTotalRecords(r.data?.totalRecords || 0);
      })
      .catch((e) => {
        console.error(e);
        setError(e.response?.data?.message || e.message || "Gagal memuat pesanan");
      })
      .finally(() => setLoading(false));
  }, [status, search, page]);

  return (
    <div
      className="mobile-container relative shadow-2xl pb-28"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-[#1A0000] via-[#350000] to-[#540101] z-0" />

      <div className="relative z-10">
        <header className="px-5 pt-12 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[10px] font-semibold px-2 py-1 rounded-full backdrop-blur">
                <Briefcase className="w-3 h-3" /> SALES
              </div>
              <p className="text-[#dedede] text-sm mt-2 font-medium">Halo,</p>
              <h1 className="text-white text-xl font-bold">{sales?.fullName || sales?.username}</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/sales/notifications")}
                aria-label="Notifikasi"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative backdrop-blur-sm border border-white/5"
              >
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/sales/login", { replace: true });
                }}
                aria-label="Keluar"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <h2 className="text-white text-[16px] font-bold mt-4">Approval Pesanan Customer</h2>
        </header>

        <section className="bg-[#FBF9F9] rounded-t-[20px] -mt-2 min-h-[calc(100vh-200px)] px-5 pt-[18px]">
          {/* Search */}
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

          {/* Status chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-4 -mx-1 px-1">
            {STATUS_OPTIONS.map((opt) => {
              const active = status === opt.value;
              return (
                <button
                  key={opt.value || "all"}
                  onClick={() => {
                    setPage(1);
                    setStatus(opt.value);
                  }}
                  className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold border ${
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

          {!loading && !error && (
            <div className="text-[11px] text-gray-500 mt-3">
              {totalRecords} pesanan {status && `· ${status}`}
            </div>
          )}

          <div className="mt-3 space-y-3">
            {loading && (
              <div className="text-center text-gray-400 py-12 text-sm">Memuat pesanan...</div>
            )}
            {!loading && error && (
              <div className="text-center text-red-600 py-12 text-sm">{error}</div>
            )}
            {!loading && !error && orders.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-[#F6F3F3]">
                Tidak ada pesanan dengan filter ini
              </div>
            )}

            {!loading &&
              orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate(`/sales/approval/${o.id}`)}
                  className="w-full bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] text-left"
                >
                  <div className="flex justify-between items-start pb-3 border-b border-gray-100 border-dashed mb-3">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-[#1A0000] text-[15px] truncate">
                        {o.orderNumber}
                      </p>
                      <p className="text-[12px] text-[#606060] mt-0.5">
                        {o.customerName || "—"} · {o.customerPhone || "-"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(o.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <div className="space-y-1.5 text-[13px]">
                    <Row label="Produk" value={`${o.itemCount} produk`} />
                    <Row label="Total Qty" value={`${o.totalQuantity} pcs`} />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-gray-500">Total</span>
                      <span className="text-[#B20605] font-bold text-[15px]">
                        {rupiah(o.total)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
          </div>

          {/* Pagination */}
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

export function StatusBadge({ status }) {
  const style = (() => {
    switch (status) {
      case "Menunggu Konfirmasi":
        return "bg-[#FFF0E6] text-[#E87B1E]";
      case "Diproses Sales":
        return "bg-blue-50 text-blue-700";
      case "Selesai":
        return "bg-green-50 text-green-700";
      case "Dibatalkan":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  })();
  return (
    <span className={`${style} px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0`}>
      {status}
    </span>
  );
}
