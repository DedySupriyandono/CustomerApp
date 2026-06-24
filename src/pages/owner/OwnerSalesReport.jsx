import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { ownerApi } from "../../contexts/OwnerAuthContext";
import { LineChart } from "../../components/owner/OwnerCharts";

const ID_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function fmtRupiahShort(v) {
  const n = Number(v) || 0;
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(1)}K`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function OwnerSalesReport() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(currentMonth());
  const [sum, setSum] = useState(null);
  const [trend, setTrend] = useState({ points: [] });
  const [byOutlet, setByOutlet] = useState({ items: [] });
  const [byProduct, setByProduct] = useState({ items: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, t, o, p] = await Promise.all([
          ownerApi.get(`/owner/reports/sales?month=${month}`),
          ownerApi.get(`/owner/dashboard/revenue-trend?month=${month}`),
          ownerApi.get(`/owner/reports/sales/by-outlet?month=${month}&top=5`),
          ownerApi.get(`/owner/reports/sales/by-product?month=${month}&top=5`),
        ]);
        if (!alive) return;
        setSum(s.data);
        setTrend(t.data);
        setByOutlet(o.data);
        setByProduct(p.data);
      } catch (e) {
        if (e.response?.status === 401) navigate("/owner/login", { replace: true });
      }
    })();
    return () => { alive = false; };
  }, [month, navigate]);

  return (
    <div
      className="mobile-container min-h-screen bg-[#F8F9FC] pb-10"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="bg-white px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="-ml-1 p-1">
          <ArrowLeft className="w-6 h-6 text-[#1E1B4B]" />
        </button>
        <h1 className="text-[20px] font-bold text-[#1E1B4B]">Sales Report</h1>
      </div>

      <div className="px-4 mt-3 grid grid-cols-2 gap-3">
        <Card label="Total Value"  value={fmtRupiahShort(sum?.totalValue)}  color="text-blue-600" />
        <Card label="Net Revenue"  value={fmtRupiahShort(sum?.netRevenue)}  color="text-emerald-500" />
        <Card label="Total Profit" value={fmtRupiahShort(sum?.totalProfit)} color="text-[#1E1B4B]" />
        <Card label="AVG Margin"   value={`${Number(sum?.avgMargin || 0).toFixed(1)}%`} color="text-orange-500" />
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[14px] font-bold text-[#1E1B4B]">Weekly Revenue Trend</h3>
          <MonthPicker value={month} onChange={setMonth} />
        </div>
        <LineChart points={trend?.points || []} color="#1E1B4B" />
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[14px] font-bold text-[#1E1B4B]">Revenue By Outlet</h3>
          <span className="text-[11px] text-gray-400">Top {(byOutlet?.items || []).length} Outlet</span>
        </div>
        <ul className="divide-y divide-gray-100">
          {(byOutlet?.items || []).map((it) => (
            <li key={it.outletId} className="py-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#1E1B4B] truncate">{it.outletName}</p>
                <p className="text-[12px] text-gray-400 mt-0.5 truncate">Sales : {it.salesName}</p>
              </div>
              <span className="text-[14px] font-bold text-[#1E1B4B] whitespace-nowrap pl-2">
                {fmtRupiahShort(it.total)}
              </span>
            </li>
          ))}
          {!(byOutlet?.items || []).length && (
            <li className="py-6 text-center text-[12px] text-gray-400">Belum ada data outlet</li>
          )}
        </ul>
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-[14px] font-bold text-[#1E1B4B] mb-2">Revenue By Product</h3>
        <ul className="divide-y divide-gray-100">
          {(byProduct?.items || []).map((it) => (
            <li key={it.productId} className="py-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#1E1B4B] truncate">{it.productName}</p>
                <p className="text-[12px] text-gray-400 mt-0.5 truncate">{it.category}</p>
              </div>
              <span className="text-[14px] font-bold text-[#1E1B4B] whitespace-nowrap pl-2">
                {fmtRupiahShort(it.total)}
              </span>
            </li>
          ))}
          {!(byProduct?.items || []).length && (
            <li className="py-6 text-center text-[12px] text-gray-400">Belum ada data produk</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Card({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-[11px] text-gray-400 font-medium">{label}</p>
      <p className={`text-[16px] font-bold mt-1.5 break-words ${color}`}>{value}</p>
    </div>
  );
}

function MonthPicker({ value, onChange }) {
  const m = parseInt(value.split("-")[1], 10) - 1;
  return (
    <label className="relative inline-flex items-center text-[12px] text-gray-500">
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
