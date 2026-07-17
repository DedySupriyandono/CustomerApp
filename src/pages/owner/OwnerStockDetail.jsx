import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, ChevronDown, ChevronUp } from "lucide-react";
import { ownerApi } from "../../contexts/OwnerAuthContext";

export default function OwnerStockDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [outlet, setOutlet] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // Expand row per productId → cache SN yang sudah di-fetch supaya tidak reload
  // tiap toggle.
  const [expanded, setExpanded] = useState({}); // { productId: true/false }
  const [serialsMap, setSerialsMap] = useState({}); // { productId: { loading, list } }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await ownerApi.get(`/owner/reports/stocks/${id}`);
        if (!alive) return;
        setOutlet(data.outlet);
        setItems(data.items || []);
      } catch (e) {
        if (e.response?.status === 401) navigate("/owner/login", { replace: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, navigate]);

  async function toggleExpand(productId) {
    const next = !expanded[productId];
    setExpanded((s) => ({ ...s, [productId]: next }));
    // Lazy-load SN pertama kali expand.
    if (next && !serialsMap[productId]) {
      setSerialsMap((s) => ({ ...s, [productId]: { loading: true, list: [] } }));
      try {
        const { data } = await ownerApi.get(
          `/owner/reports/stocks/${id}/products/${productId}/serials`
        );
        setSerialsMap((s) => ({
          ...s,
          [productId]: { loading: false, list: data?.serials || [] },
        }));
      } catch {
        setSerialsMap((s) => ({ ...s, [productId]: { loading: false, list: [] } }));
      }
    }
  }

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
        <h1 className="text-[20px] font-bold text-white">Outlet Stock</h1>
      </div>

      {outlet && (
        <div className="mx-4 -mt-4 bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[15px] font-bold text-[#1E1B4B]">{outlet.name}</p>
          <p className="text-[12px] text-gray-400 mt-1">ID: {outlet.code}</p>
          {outlet.address && (
            <p className="text-[12px] text-gray-500 mt-1">{outlet.address}</p>
          )}
        </div>
      )}

      <div className="mx-4 mt-3 bg-white rounded-2xl p-2 shadow-sm">
        {items.length === 0 && !loading && (
          <div className="text-center py-10 text-[13px] text-gray-400">
            Belum ada stok di outlet ini
          </div>
        )}
        <ul className="divide-y divide-gray-100">
          {items.map((it) => {
            const isOpen = !!expanded[it.productId];
            const snState = serialsMap[it.productId];
            return (
              <li key={`${it.productId}`}>
                <button
                  onClick={() => toggleExpand(it.productId)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#1E1B4B] truncate">{it.productName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{it.category || it.productCode || "-"}</p>
                  </div>
                  <span className="text-[14px] font-bold text-[#1E1B4B]">
                    {Number(it.quantity || 0).toLocaleString("id-ID")}
                  </span>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase mt-3 mb-2">
                      Daftar SN / No HP ({snState?.list?.length ?? 0})
                    </p>
                    {snState?.loading && (
                      <p className="text-[12px] text-gray-400 py-2">Memuat…</p>
                    )}
                    {!snState?.loading && (snState?.list?.length ?? 0) === 0 && (
                      <p className="text-[12px] text-gray-400 py-2">
                        Produk ini tidak memiliki SN spesifik (tracking qty saja).
                      </p>
                    )}
                    {!snState?.loading && (snState?.list?.length ?? 0) > 0 && (
                      <ul className="space-y-1">
                        {snState.list.map((s, idx) => (
                          <li
                            key={`${it.productId}-${idx}`}
                            className="text-[12px] font-mono bg-white rounded px-3 py-2 border border-gray-100 text-[#1E1B4B] break-all"
                          >
                            {s.sn}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
