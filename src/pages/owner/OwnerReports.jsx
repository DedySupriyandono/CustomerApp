import { useNavigate } from "react-router-dom";
import { Bell, BarChart3, Package, RotateCcw, ChevronRight } from "lucide-react";
import OwnerBottomNav from "../../components/OwnerBottomNav";

export default function OwnerReports() {
  const navigate = useNavigate();

  return (
    <div
      className="mobile-container min-h-screen bg-[#F8F9FC] pb-28"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div
        className="px-5 pt-6 pb-8 flex items-center justify-between rounded-b-[24px]"
        style={{ background: "linear-gradient(180deg, #1A0000 0%, #540101 100%)" }}
      >
        <h1 className="text-[24px] font-bold text-white">Report</h1>
        <button className="relative bg-[#7A0202] rounded-full p-2.5">
          <Bell className="w-5 h-5 text-white" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
        </button>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        <Card
          icon={<BarChart3 className="w-7 h-7 text-blue-600" />}
          tint="bg-blue-50"
          title="Sales Report"
          desc="Monitor revenue, profit, and sales trends across outlets."
          onClick={() => navigate("/owner/reports/sales")}
        />
        <Card
          icon={<Package className="w-7 h-7 text-orange-500" />}
          tint="bg-orange-50"
          title="Outlet Stock Report"
          desc="Real-time inventory levels and reorder recommendations."
          onClick={() => navigate("/owner/reports/stocks")}
        />
        <Card
          icon={<RotateCcw className="w-7 h-7 text-rose-500" />}
          tint="bg-rose-50"
          title="Return Report"
          desc="Analyze return rates, reasons, and damaged goods."
          onClick={() => navigate("/owner/reports/returns")}
        />
      </div>

      <OwnerBottomNav />
    </div>
  );
}

function Card({ icon, tint, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left shadow-sm"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tint}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-bold text-[#1E1B4B]">{title}</h3>
        <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </button>
  );
}
