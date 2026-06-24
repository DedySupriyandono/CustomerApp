import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ChevronRight } from "lucide-react";
import { ownerApi } from "../../contexts/OwnerAuthContext";

export default function OwnerStockReport() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const { data } = await ownerApi.get(
          `/owner/reports/stocks${q ? `?search=${encodeURIComponent(q)}` : ""}`
        );
        if (alive) setItems(data.items || []);
      } catch (e) {
        if (e.response?.status === 401) navigate("/owner/login", { replace: true });
      }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q, navigate]);

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
        <h1 className="text-[20px] font-bold text-white">Outlet Stock Report</h1>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl flex items-center gap-3 px-4 py-3 shadow-sm">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search outlet..."
            className="flex-1 outline-none text-[14px] text-[#1E1B4B] placeholder-gray-400 bg-transparent"
          />
        </div>
      </div>

      <div className="px-4 mt-3 space-y-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => navigate(`/owner/reports/stocks/${it.id}`)}
            className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm text-left"
          >
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[#1E1B4B] truncate">{it.name}</p>
              <p className="text-[12px] text-gray-400 mt-1">ID: {it.code}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        ))}
        {items.length === 0 && (
          <div className="text-center py-10 text-[13px] text-gray-400">
            Tidak ada outlet ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
