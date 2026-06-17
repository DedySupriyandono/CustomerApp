import { useEffect, useState } from "react";
import { Flame, ChevronRight } from "lucide-react";
import bagImg from "../assets/bag-mascot.png";
import { rupiah } from "../utils/format";

// Flash Sale section di Home. Fetch dari API CMS, scroll horizontal.
// Props:
//   - apiClient: axios instance (api / salesApi)
//   - urlPrefix: "/customer" atau "/sales"
//   - onItemClick(item): callback saat tap card (mis. navigate ke detail product)
export default function FlashSaleSection({ apiClient, urlPrefix = "/customer", onItemClick }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .get(`${urlPrefix}/flash-sales`)
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, [apiClient, urlPrefix]);

  if (!loaded) return null;
  if (items.length === 0) return null; // hide kalau gak ada item aktif

  return (
    <div className="mt-4 mx-5 bg-gradient-to-br from-[#410000] to-[#220000] rounded-[20px] p-4 relative overflow-hidden shadow-lg">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#FF9D00] fill-[#FF9D00]" />
          <h2 className="text-white font-bold text-base">Flash Sale</h2>
        </div>
        <ChevronRight className="w-5 h-5 text-white/80" />
      </div>

      <div className="absolute -left-6 top-16 w-32 h-32 z-0 pointer-events-none">
        <img src={bagImg} alt="" className="w-full h-full object-contain" />
      </div>

      <div className="relative z-10 ml-20 -mr-4 pr-4 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {items.map((it) => {
          const showDiscount = !!it.discountPercent && it.discountPercent > 0;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onItemClick && onItemClick(it)}
              className="shrink-0 w-[140px] bg-white rounded-2xl p-3 text-left relative shadow-md"
            >
              {showDiscount && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#B20605] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  -{it.discountPercent}%
                </div>
              )}
              <div className="font-bold text-[13px] text-[#1A0000] truncate">
                {it.productName || `#${it.productId}`}
              </div>
              {it.categoryName && (
                <div className="text-[10px] text-gray-400 truncate">{it.categoryName}</div>
              )}
              {it.originalPrice > it.salePrice && (
                <div className="text-[10px] text-gray-400 line-through mt-2">
                  {rupiah(it.originalPrice)}
                </div>
              )}
              <div className="text-[13px] font-bold text-[#E87B1E]">{rupiah(it.salePrice)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
