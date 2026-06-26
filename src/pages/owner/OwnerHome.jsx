import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import Swal from "sweetalert2";
import { ownerApi, useOwnerAuth } from "../../contexts/OwnerAuthContext";
import { LineChart } from "../../components/owner/OwnerCharts";
import OwnerBottomNav from "../../components/OwnerBottomNav";

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

function fmtInt(v) {
  return Number(v || 0).toLocaleString("id-ID");
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function OwnerHome() {
  const navigate = useNavigate();
  const { owner } = useOwnerAuth();
  const [month, setMonth] = useState(currentMonth());
  const [dash, setDash] = useState(null);
  const [trend, setTrend] = useState({ points: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, t] = await Promise.all([
          ownerApi.get(`/owner/dashboard?month=${month}`),
          ownerApi.get(`/owner/dashboard/revenue-trend?month=${month}`),
        ]);
        if (!alive) return;
        setDash(d.data);
        setTrend(t.data);
      } catch (e) {
        if (e.response?.status === 401) navigate("/owner/login", { replace: true });
      }
    })();
    return () => { alive = false; };
  }, [month, navigate]);

  const monthIdx = parseInt(month.split("-")[1], 10) - 1;
  const monthLabel = ID_MONTHS[monthIdx] || month;

  return (
    <div
      className="mobile-container min-h-screen bg-[#F8F9FC] pb-28"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div
        className="px-5 pt-6 pb-8 flex items-start justify-between rounded-b-[24px]"
        style={{ background: "linear-gradient(180deg, #1A0000 0%, #540101 100%)" }}
      >
        <div>
          <p className="text-sm text-white/80">Welcome back,</p>
          <h1 className="text-[20px] font-bold text-white mt-0.5">
            {owner?.fullName || owner?.username || "Owner"}
          </h1>
        </div>
        <button
          onClick={() => Swal.fire({ icon: "info", title: "Notifikasi", text: "Halaman notifikasi owner akan segera tersedia." })}
          aria-label="Notifikasi"
          className="relative bg-[#7A0202] rounded-full p-2.5"
        >
          <Bell className="w-5 h-5 text-white" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
        </button>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 -mt-4">
        <StatCard
          label="SALES THIS MONTH"
          value={fmtRupiahShort(dash?.salesThisMonth)}
          delta={dash?.salesDeltaPct}
        />
        <StatCard
          label="TOTAL ORDERS"
          value={fmtInt(dash?.totalOrders)}
          delta={dash?.ordersDeltaPct}
        />
        <StatCard
          label="RETURN RATE"
          value={`${Number(dash?.returnRate || 0).toFixed(1)}%`}
          delta={dash?.returnRateDeltaPct}
          inversedDelta
        />
        <StatCard
          label="GROSS PROFIT"
          value={fmtRupiahShort(dash?.grossProfit)}
          delta={dash?.grossDeltaPct}
        />
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[14px] font-bold text-[#1E1B4B]">Weekly Revenue Trend</h3>
          <MonthPicker value={month} onChange={setMonth} />
        </div>
        <LineChart points={trend?.points || []} color="#1E1B4B" />
      </div>

      <OwnerBottomNav />
    </div>
  );
}

function StatCard({ label, value, delta, inversedDelta = false }) {
  const v = Number(delta || 0);
  // Untuk return rate, kenaikan = jelek, jadi tampilan delta dibalik
  // (naik = merah, turun = hijau).
  const positive = inversedDelta ? v <= 0 : v >= 0;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-[18px] font-bold text-[#1E1B4B] mt-1.5 break-words">{value}</p>
      <div className={`flex items-center gap-1 mt-2 text-[11px] font-semibold ${positive ? "text-emerald-500" : "text-rose-500"}`}>
        {positive
          ? <TrendingUp className="w-3 h-3" />
          : <TrendingDown className="w-3 h-3" />}
        {v >= 0 ? "+" : ""}{Number(delta || 0).toFixed(1)}%
      </div>
    </div>
  );
}

// Pilih bulan inline — versi simple, pakai <select> native disamarin.
function MonthPicker({ value, onChange }) {
  const [y, m] = value.split("-");
  const label = `${ID_MONTHS[parseInt(m, 10) - 1] || m}`;
  return (
    <label className="relative inline-flex items-center text-[12px] text-gray-500">
      <span>{label}</span>
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
