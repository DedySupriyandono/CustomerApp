import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { ownerApi } from "../../contexts/OwnerAuthContext";
import { BarChart, DonutChart } from "../../components/owner/OwnerCharts";

const ID_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const REASON_COLORS = ["#EF4444", "#F59E0B", "#3B82F6", "#9CA3AF", "#10B981", "#8B5CF6"];

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

export default function OwnerReturnReport() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(currentMonth());
  const [sum, setSum] = useState(null);
  const [trend, setTrend] = useState({ points: [] });
  const [reasons, setReasons] = useState({ items: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, t, r] = await Promise.all([
          ownerApi.get(`/owner/reports/returns?month=${month}`),
          ownerApi.get(`/owner/reports/returns/trend?month=${month}`),
          ownerApi.get(`/owner/reports/returns/reasons?month=${month}`),
        ]);
        if (!alive) return;
        setSum(s.data);
        setTrend(t.data);
        setReasons(r.data);
      } catch (e) {
        if (e.response?.status === 401) navigate("/owner/login", { replace: true });
      }
    })();
    return () => { alive = false; };
  }, [month, navigate]);

  const donutItems = (reasons?.items || []).map((it, i) => ({
    label: it.reason,
    value: it.percent,
    color: REASON_COLORS[i % REASON_COLORS.length],
  }));

  return (
    <div
      className="mobile-container min-h-screen bg-[#F8F9FC] pb-10"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="bg-white px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="-ml-1 p-1">
          <ArrowLeft className="w-6 h-6 text-[#1E1B4B]" />
        </button>
        <h1 className="text-[20px] font-bold text-[#1E1B4B]">Return Report</h1>
      </div>

      <div className="px-4 mt-3 grid grid-cols-2 gap-3">
        <Card label="Total Return Value" value={fmtRupiahShort(sum?.totalValue)} hint={`${sum?.returnsCount || 0} return bulan ini`} />
        <Card label="Return Rate" value={`${Number(sum?.returnRate || 0).toFixed(1)}%`} hint="Industry Avg: 1.5%" />
        <Card label="Top Product"
              value={sum?.topProduct?.productName || "—"}
              hint={`${sum?.topProduct?.unitsReturned || 0} units returned`} />
        <Card label="Top Outlet"
              value={sum?.topOutlet?.outletName || "—"}
              hint={`${sum?.topOutlet?.returnsCount || 0} returns`} />
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[14px] font-bold text-[#1E1B4B]">Weekly Return Trend</h3>
          <MonthPicker value={month} onChange={setMonth} />
        </div>
        <BarChart points={trend?.points || []} color="#EF4444" />
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[14px] font-bold text-[#1E1B4B]">Return Reasons</h3>
          <MonthPicker value={month} onChange={setMonth} />
        </div>
        <div className="flex items-center gap-4">
          <DonutChart items={donutItems} size={130} thickness={22} />
          <ul className="flex-1 space-y-3">
            {donutItems.map((it, i) => (
              <li key={i} className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: it.color }} />
                  {it.label}
                </div>
                <span className="font-bold text-[#1E1B4B]">{it.value}%</span>
              </li>
            ))}
            {donutItems.length === 0 && (
              <li className="text-[12px] text-gray-400 py-3 text-center">Belum ada return bulan ini</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, hint }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-[11px] text-gray-400 font-medium">{label}</p>
      <p className="text-[16px] font-bold text-[#1E1B4B] mt-1.5 break-words truncate">{value}</p>
      {hint && <p className="text-[11px] text-orange-500 mt-1.5">{hint}</p>}
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
