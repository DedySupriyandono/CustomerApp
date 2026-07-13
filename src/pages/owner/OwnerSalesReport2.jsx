import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { ownerApi } from "../../contexts/OwnerAuthContext";
import { BarChart, DonutChart } from "../../components/owner/OwnerCharts";

const ID_MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

const TABS = [
  { key: "branch",   label: "Per Branch" },
  { key: "regional", label: "Per Regional" },
  { key: "customer", label: "Per Customer" },
  { key: "sales",    label: "Per Sales Force" },
  { key: "invoice",  label: "Per Invoice" },
];

const PALETTE = [
  "#B20605", "#F97316", "#F59E0B", "#10B981", "#0EA5E9",
  "#6366F1", "#8B5CF6", "#EC4899", "#14B8A6", "#84CC16",
];

function fmtRupiah(v) {
  const n = Number(v) || 0;
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(1)}K`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function OwnerSalesReport2() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("branch");
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState({ items: [], dimensionLabel: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    ownerApi
      .get(`/owner/reports/sales-by-dimension?groupBy=${tab}&month=${month}&top=10`)
      .then((r) => alive && setData(r.data))
      .catch((e) => {
        if (e.response?.status === 401) navigate("/owner/login", { replace: true });
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tab, month, navigate]);

  const items = data?.items || [];
  const totalRevenue = items.reduce((s, x) => s + Number(x.revenue || 0), 0);
  const totalOrders  = items.reduce((s, x) => s + Number(x.orders  || 0), 0);
  const maxVal       = Math.max(1, ...items.map((x) => Number(x.revenue || 0)));

  // Bar chart data (top 5 for visual clarity)
  const top5BarPoints = useMemo(() => {
    return items.slice(0, 5).map((x, i) => ({
      label: (x.label || "-").substring(0, 8),
      value: Number(x.revenue || 0),
    }));
  }, [items]);

  // Donut chart data (top 5 + others)
  const donutItems = useMemo(() => {
    const top = items.slice(0, 5);
    const rest = items.slice(5);
    const restTotal = rest.reduce((s, x) => s + Number(x.revenue || 0), 0);
    const arr = top.map((x, i) => ({
      label: x.label || "-",
      value: Number(x.revenue || 0),
      color: PALETTE[i % PALETTE.length],
    }));
    if (restTotal > 0) {
      arr.push({ label: "Others", value: restTotal, color: "#9CA3AF" });
    }
    return arr;
  }, [items]);

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
        <h1 className="text-[20px] font-bold text-white">Sales Report</h1>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-4 mb-3">
        <div className="bg-white rounded-2xl p-1.5 shadow-sm flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap transition ${
                tab === t.key
                  ? "bg-[#B20605] text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Month + KPI */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-400">Total Revenue ({data.dimensionLabel || "—"})</p>
          <p className="text-[20px] font-bold text-[#B20605]">{fmtRupiah(totalRevenue)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{totalOrders} orders · {items.length} baris</p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Bar chart top 5 */}
      <div className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-[13px] font-bold text-[#1E1B4B] mb-2">Top 5 — Revenue Chart</h3>
        {items.length === 0 && !loading ? (
          <div className="text-center py-8 text-sm text-gray-400">Belum ada data bulan ini</div>
        ) : (
          <BarChart points={top5BarPoints} color="#B20605" height={180} />
        )}
      </div>

      {/* Donut share */}
      <div className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-[13px] font-bold text-[#1E1B4B] mb-2">Share Revenue</h3>
        <div className="flex items-center gap-4">
          <DonutChart items={donutItems} size={140} thickness={22} />
          <ul className="flex-1 space-y-2 max-h-[160px] overflow-y-auto">
            {donutItems.map((it, i) => {
              const pct = totalRevenue > 0 ? (it.value / totalRevenue) * 100 : 0;
              return (
                <li key={i} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2 text-gray-600 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: it.color }} />
                    <span className="truncate">{it.label}</span>
                  </div>
                  <span className="font-bold text-[#1E1B4B] shrink-0 ml-2">{pct.toFixed(1)}%</span>
                </li>
              );
            })}
            {donutItems.length === 0 && (
              <li className="text-[12px] text-gray-400 py-3 text-center">—</li>
            )}
          </ul>
        </div>
      </div>

      {/* Ranked list — horizontal bar per row */}
      <div className="mx-4 mb-6 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-[13px] font-bold text-[#1E1B4B] mb-3">Peringkat {data.dimensionLabel || "—"}</h3>
        {loading && <div className="text-center py-6 text-sm text-gray-400">Memuat...</div>}
        {!loading && items.length === 0 && (
          <div className="text-center py-6 text-sm text-gray-400">Belum ada data</div>
        )}
        <div className="space-y-3">
          {items.map((it, i) => {
            const pct = (Number(it.revenue) / maxVal) * 100;
            const color = PALETTE[i % PALETTE.length];
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#1E1B4B] truncate">{it.label || "-"}</div>
                      {it.sub && (
                        <div className="text-[10px] text-gray-400 truncate">{it.sub}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="font-bold text-[#B20605] text-[13px]">{fmtRupiah(it.revenue)}</div>
                    <div className="text-[10px] text-gray-400">
                      {tab === "invoice" ? "1 order" : `${it.orders} orders`}
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthPicker({ value, onChange }) {
  const m = parseInt(value.split("-")[1], 10) - 1;
  return (
    <label className="relative inline-flex items-center bg-white rounded-xl px-3 py-1.5 shadow-sm text-[12px] text-gray-600 font-semibold">
      <span>{ID_MONTHS[m] || value}</span>
      <ChevronDown className="w-4 h-4 ml-1" />
      <input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value || value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        max={currentMonth()}
      />
    </label>
  );
}
