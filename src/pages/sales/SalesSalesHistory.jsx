import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bell, ShoppingCart, Search,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Calendar, Receipt, Package,
} from "lucide-react";
import salesApi from "../../api/salesApi";
import SalesBottomNav from "../../components/SalesBottomNav";
import { useSalesCart } from "../../contexts/SalesCartContext";
import { rupiah } from "../../utils/format";

// Penjualan Saya (Sales) — data dari sales_stock_values (Status=Sold).
// Header per sold_ref (= sale_number "SELL-..."). Klik header untuk expand.
// Filter: date range (from–to, default 30 hari) + search sold_ref.
// Backend: GET /sales/sell/history & /sales/sell/history/:ref

const PAGE_SIZE = 10;

const fmtYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export default function SalesSalesHistory() {
  const navigate = useNavigate();
  const { totalItems } = useSalesCart();

  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 30);

  const [from, setFrom] = useState(fmtYmd(monthAgo));
  const [to, setTo] = useState(fmtYmd(today));
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sales, setSales] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expanded, setExpanded] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    salesApi
      .get("/sales/sell/history", {
        params: { from, to, search: search || undefined, page, pageSize: PAGE_SIZE },
      })
      .then((r) => {
        setSales(r.data?.data || []);
        setTotalPages(r.data?.totalPages || 0);
        setTotalRecords(r.data?.totalRecords || 0);
      })
      .catch((e) => setError(e.response?.data?.message || e.message || "Gagal memuat penjualan"))
      .finally(() => setLoading(false));
  }, [from, to, search, page]);

  const summary = useMemo(() => {
    const itemCount = sales.reduce((s, x) => s + (x.itemCount || 0), 0);
    const totalNominal = sales.reduce((s, x) => s + Number(x.total || 0), 0);
    return { itemCount, totalNominal };
  }, [sales]);

  const applySearch = (e) => {
    e?.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const toggleExpand = async (saleNumber) => {
    if (expanded === saleNumber) {
      setExpanded(null);
      return;
    }
    setExpanded(saleNumber);
    if (detailCache[saleNumber]) return;
    setDetailLoading(true);
    try {
      const r = await salesApi.get(`/sales/sell/history/${encodeURIComponent(saleNumber)}`);
      setDetailCache((c) => ({ ...c, [saleNumber]: r.data }));
    } catch (e) {
      setDetailCache((c) => ({ ...c, [saleNumber]: { error: e.response?.data?.message || "Gagal memuat detail" } }));
    } finally {
      setDetailLoading(false);
    }
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
            <h1 className="text-white text-base font-bold leading-[26px]">Penjualan Saya</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/sales/notifications")} aria-label="Notifikasi" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>
            <button
              onClick={() => navigate("/sales/checkout")}
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
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-3 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <Receipt className="w-3.5 h-3.5 text-[#1F7A4D]" /> Transaksi
              </div>
              <div className="text-[18px] font-bold text-[#1A0000] mt-1">{totalRecords}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{summary.itemCount} item (page ini)</div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <Package className="w-3.5 h-3.5 text-[#B20605]" /> Total (page)
              </div>
              <div className="text-[18px] font-bold text-[#B20605] mt-1 truncate">
                {rupiah(summary.totalNominal)}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Harga saat ini</div>
            </div>
          </div>

          {/* Date filter */}
          <div className="bg-white rounded-2xl p-3 border border-[#F6F3F3] shadow-[0_2px_15px_rgba(0,0,0,0.03)] mb-3">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-2">
              <Calendar className="w-3.5 h-3.5 text-[#B20605]" /> Rentang tanggal
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] text-gray-400">Dari</span>
                <input
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => { setPage(1); setFrom(e.target.value); }}
                  className="w-full text-[13px] text-[#1A0000] border border-[#F6F3F3] rounded-lg px-2 py-1.5 mt-0.5 focus:outline-none focus:border-[#B20605]"
                />
              </label>
              <label className="block">
                <span className="text-[10px] text-gray-400">Sampai</span>
                <input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => { setPage(1); setTo(e.target.value); }}
                  className="w-full text-[13px] text-[#1A0000] border border-[#F6F3F3] rounded-lg px-2 py-1.5 mt-0.5 focus:outline-none focus:border-[#B20605]"
                />
              </label>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={applySearch} role="search" className="w-full">
            <label className="relative flex w-full h-12 bg-white rounded-[10px] border border-[#F6F3F3]">
              <span className="sr-only">Cari no. jual</span>
              <div className="absolute top-1/2 -translate-y-1/2 left-1 bg-[#FFF5F5] p-[7px] rounded-lg">
                <Search className="w-[18px] h-[18px] text-[#B20605]" />
              </div>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={applySearch}
                placeholder="Cari no. jual (SELL-...)"
                className="absolute inset-0 pl-[52px] pr-3 text-sm text-[#1A0000] placeholder:text-[#606060] focus:outline-none rounded-[10px] bg-transparent"
              />
            </label>
          </form>

          {!loading && !error && (
            <div className="text-[11px] text-gray-500 mt-3">
              {totalRecords} penjualan {search && `· "${search}"`}
            </div>
          )}

          <div className="mt-3 space-y-3">
            {loading && (
              <div className="text-center text-gray-400 py-12 text-sm">Memuat penjualan...</div>
            )}
            {!loading && error && (
              <div className="text-center text-red-600 py-12 text-sm">{error}</div>
            )}
            {!loading && !error && sales.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-[#F6F3F3]">
                Belum ada penjualan pada periode ini
              </div>
            )}

            {!loading && sales.map((s) => {
              const open = expanded === s.saleNumber;
              const detail = detailCache[s.saleNumber];
              return (
                <div
                  key={s.saleNumber}
                  className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(s.saleNumber)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex justify-between items-start pb-3 border-b border-gray-100 border-dashed mb-3">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-[#1A0000] text-[15px] truncate">
                          {s.saleNumber}
                        </p>
                        <p className="text-gray-400 text-[11px] mt-0.5">
                          {s.soldAt ? new Date(s.soldAt).toLocaleString("id-ID") : "-"}
                        </p>
                      </div>
                      <div className="bg-[#E6F4EA] text-[#1F7A4D] px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 flex items-center gap-1">
                        Sold
                        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="space-y-2 text-[13px]">
                      <Row label="Total Item" value={`${s.itemCount} pcs`} />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-gray-500">Total</span>
                        <span className="font-bold text-[15px] text-[#B20605]">
                          {rupiah(s.total)}
                        </span>
                      </div>
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-[#FBF9F9]">
                      {detailLoading && !detail && (
                        <div className="text-center text-gray-400 text-[12px] py-4">Memuat detail...</div>
                      )}
                      {detail?.error && (
                        <div className="text-center text-red-600 text-[12px] py-4">{detail.error}</div>
                      )}
                      {detail?.items && (
                        <div className="pt-3 space-y-2">
                          {detail.items.map((it) => (
                            <div
                              key={it.valueId}
                              className="bg-white rounded-xl px-3 py-2 border border-[#F6F3F3] flex justify-between items-center gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-[#1A0000] truncate">
                                  {it.productName || it.productNumber || "-"}
                                </p>
                                <p className="text-[10px] text-gray-500 font-mono truncate">
                                  SN: {it.sn || "-"}
                                </p>
                              </div>
                              <span className="text-[12px] font-bold text-[#B20605] shrink-0">
                                {rupiah(it.unitPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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
