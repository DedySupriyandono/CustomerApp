import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronLeft, ChevronRight, PackageOpen, Search } from "lucide-react";
import salesApi from "../../api/salesApi";
import { useSalesAuth } from "../../contexts/SalesAuthContext";
import SalesBottomNav from "../../components/SalesBottomNav";
import { rupiah } from "../../utils/format";

// Penerimaan Barang — history outbound dari admin gudang ke SF ini.
// Endpoint: GET /api/sales/outbounds
const PAGE_SIZE = 10;

export default function SalesInbound() {
  const navigate = useNavigate();
  const { sales } = useSalesAuth();

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    salesApi
      .get("/sales/outbounds", {
        params: { search: search || undefined, page, pageSize: PAGE_SIZE },
      })
      .then((r) => {
        setRows(r.data?.data || []);
        setTotalPages(r.data?.totalPages || 0);
        setTotalRecords(r.data?.totalRecords || 0);
      })
      .catch((e) => setError(e.response?.data?.message || e.message || "Gagal memuat"))
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <div
      className="mobile-container relative shadow-2xl pb-28"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b from-[#1A0000] via-[#350000] to-[#540101] z-0" />

      <div className="relative z-10">
        <header className="px-5 pt-12 pb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-lg font-bold">Penerimaan Barang</h1>
            <button
              onClick={() => navigate("/sales/notifications")}
              aria-label="Notifikasi"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5"
            >
              <Bell className="w-5 h-5 text-white" />
            </button>
          </div>
          <p className="text-[#dedede] text-xs mt-3">
            Riwayat pengeluaran dari gudang. Klik untuk detail SN + harga.
          </p>
        </header>

        <section className="px-5 -mt-2">
          <div className="bg-white rounded-2xl p-3 mb-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 ml-1" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
              placeholder="Cari no. pengeluaran / ref..."
              className="flex-1 text-sm outline-none"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                className="text-xs text-gray-500 px-2"
              >×</button>
            )}
          </div>

          <div className="text-xs text-gray-500 mb-2">{totalRecords} pengeluaran</div>

          <div className="flex flex-col gap-3">
            {loading && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-[#F6F3F3]">
                Memuat...
              </div>
            )}
            {!loading && error && (
              <div className="bg-red-50 rounded-2xl p-4 text-center text-red-600 text-sm border border-red-100">
                {error}
              </div>
            )}
            {!loading && !error && rows.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-[#F6F3F3]">
                Belum ada penerimaan barang
              </div>
            )}

            {!loading && rows.map((o) => (
              <button
                key={o.id}
                onClick={() => navigate(`/sales/inbound/${o.uid}`)}
                className="w-full bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] text-left"
              >
                <div className="flex justify-between items-start pb-3 border-b border-gray-100 border-dashed mb-3">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-[#1A0000] text-[15px] truncate flex items-center gap-1.5">
                      <PackageOpen className="w-4 h-4 text-[#B20605]" />
                      {o.outboundNo}
                    </p>
                    <p className="text-[12px] text-[#606060] mt-0.5 truncate">
                      dari {o.warehouseName || "—"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {o.closedAt ? new Date(o.closedAt).toLocaleString("id-ID") : "-"}
                    </p>
                    {o.refNo && <p className="text-[11px] text-gray-500 mt-0.5">Ref: {o.refNo}</p>}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
                    Selesai
                  </span>
                </div>

                <div className="space-y-1.5 text-[13px]">
                  <Row label="Produk" value={`${o.itemCount} produk`} />
                  <Row label="Total Qty" value={`${o.totalQuantity} pcs`} />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-500">Nilai Snapshot</span>
                    <span className="text-[#B20605] font-bold text-[15px]">
                      {rupiah(o.totalValue)}
                    </span>
                  </div>
                </div>
              </button>
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
              <span className="text-sm text-gray-500">Page <b>{page}</b> / {totalPages}</span>
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
