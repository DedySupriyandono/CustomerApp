import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { ownerApi } from "../../contexts/OwnerAuthContext";

function fmtRupiah(v) {
  const n = Number(v) || 0;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

export default function OwnerSalesStockDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await ownerApi.get(`/owner/reports/sales-force-stocks/${id}`);
        if (alive) setData(data);
      } catch (e) {
        if (e.response?.status === 401) navigate("/owner/login", { replace: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, navigate]);

  const sf = data?.salesForce;
  const products = data?.products || [];

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
        <h1 className="text-[20px] font-bold text-white">Sales Force Stock</h1>
      </div>

      {sf && (
        <div className="mx-4 -mt-4 bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[15px] font-bold text-[#1E1B4B]">{sf.name}</p>
          <p className="text-[12px] text-gray-400 mt-1">Kode: {sf.code || "-"}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <div className="flex-1">
              <p className="text-[11px] text-gray-400">Total Unit</p>
              <p className="text-[16px] font-bold text-[#B20605]">
                {Number(data?.totalUnits || 0).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-400">Total Nilai</p>
              <p className="text-[16px] font-bold text-[#1E1B4B]">{fmtRupiah(data?.totalValue)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-4 mt-3 bg-white rounded-2xl p-2 shadow-sm">
        {!loading && products.length === 0 && (
          <div className="text-center py-10 text-[13px] text-gray-400">
            Belum ada stok Available di sales force ini
          </div>
        )}
        {loading && (
          <div className="text-center py-10 text-[13px] text-gray-400">Memuat...</div>
        )}
        <ul className="divide-y divide-gray-100">
          {products.map((it) => (
            <li key={it.productId} className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#1E1B4B] truncate">{it.productName}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{it.productNumber || "-"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[14px] font-bold text-[#1E1B4B]">
                  {Number(it.units || 0).toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] text-gray-400">{fmtRupiah(it.totalValue)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
