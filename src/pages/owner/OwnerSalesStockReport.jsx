import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ChevronRight, Users } from "lucide-react";
import { ownerApi } from "../../contexts/OwnerAuthContext";

// Sales Force Stock Report — list per sales force dgn ringkasan stok
// Available (sales_stock_values). Filter "Semua" / "Punya Stok" mengirim
// hasStock=true ke backend, backend memfilter row totalUnits > 0.
export default function OwnerSalesStockReport() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set("search", q);
        if (filter === "with") params.set("hasStock", "true");
        const qs = params.toString();
        const { data } = await ownerApi.get(
          `/owner/reports/sales-force-stocks${qs ? `?${qs}` : ""}`
        );
        if (alive) setItems(data.items || []);
      } catch (e) {
        if (e.response?.status === 401) navigate("/owner/login", { replace: true });
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q, filter, navigate]);

  return (
    <div
      className="mobile-container min-h-screen bg-[#F8F9FC] pb-10"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div
        className="px-4 pt-6 pb-8 flex items-center gap-3 rounded-b-[24px]"
        style={{ background: "linear-gradient(180deg, #1A0000 0%, #540101 100%)" }}
      >
        <button onClick={() => navigate(-1)} className="-ml-1 p-1">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-[20px] font-bold text-white">Sales Force Stock Report</h1>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        <div className="bg-white rounded-2xl flex items-center gap-3 px-4 py-3 shadow-sm">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sales force..."
            className="flex-1 outline-none text-[14px] text-[#1E1B4B] placeholder-gray-400 bg-transparent"
          />
        </div>

        <div className="bg-white rounded-2xl p-1.5 shadow-sm flex gap-1">
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>Semua</FilterBtn>
          <FilterBtn active={filter === "with"} onClick={() => setFilter("with")}>Punya Stok</FilterBtn>
        </div>
      </div>

      <div className="px-4 mt-3 space-y-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => navigate(`/owner/reports/sales-stock/${it.id}`)}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-[#1E1B4B] truncate">{it.name || "-"}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{it.code || "-"}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] text-gray-500">
                  <span className="font-bold text-[#B20605]">{it.totalUnits}</span> unit
                </span>
                <span className="text-[11px] text-gray-500">
                  <span className="font-bold text-[#1E1B4B]">{it.productCount}</span> produk
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-center py-10 text-[13px] text-gray-400">
            Tidak ada sales force ditemukan
          </div>
        )}
        {loading && (
          <div className="text-center py-6 text-[13px] text-gray-400">Memuat...</div>
        )}
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition ${
        active ? "bg-[#B20605] text-white" : "text-gray-500 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}
