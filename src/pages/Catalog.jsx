import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ShoppingCart,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import api from "../api/api";
import BottomNav from "../components/BottomNav";
import { rupiah } from "../utils/format";
import { useCart } from "../contexts/CartContext";

export default function Catalog() {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/customer/products/GetAll")
      .then((r) => {
        console.log("[Catalog] products:", r.data);
        setProducts(Array.isArray(r.data) ? r.data : []);
      })
      .catch((e) => {
        console.error("[Catalog] load error:", e);
        setError(e.response?.data?.message || e.message || "Gagal memuat data");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.productName?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    );
  }, [products, search]);

  return (
    <div
      className="mobile-container relative shadow-2xl"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b from-[#540101] to-[#2A0000] z-0" />

      <div className="relative z-10 pb-28">
        <header className="flex items-center justify-between px-5 pt-12 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-base font-bold leading-[26px]">Katalog</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>
            <button
              onClick={() => navigate("/checkout")}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B20605] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </header>

        <section className="bg-[#FBF9F9] rounded-t-[20px] -mt-2 min-h-[calc(100vh-180px)] px-5 pt-[18px]">
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-4 w-full"
          >
            <label className="relative flex-1 h-12 bg-white rounded-[10px] border border-[#F6F3F3]">
              <span className="sr-only">Cari produk</span>
              <div className="absolute top-1/2 -translate-y-1/2 left-1 bg-[#FFF5F5] p-[7px] rounded-lg">
                <Search className="w-[18px] h-[18px] text-[#B20605]" />
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                aria-label="Cari produk"
                className="absolute inset-0 pl-[52px] pr-3 text-sm text-[#1A0000] placeholder:text-[#606060] focus:outline-none rounded-[10px] bg-transparent"
              />
            </label>
            <button
              type="button"
              aria-label="Filter katalog"
              className="p-2.5 rounded-[10px] bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)]"
            >
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </button>
          </form>

          <div className="flex flex-col items-start gap-4 w-full mt-6">
            {loading && (
              <div className="w-full text-center text-gray-400 py-12 text-sm">
                Memuat produk...
              </div>
            )}
            {!loading && error && (
              <div className="w-full text-center text-red-600 py-12 text-sm">{error}</div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="w-full text-center text-gray-400 py-12 text-sm">
                Tidak ada produk
              </div>
            )}

            {!loading &&
              filtered.map((p) => (
                <button
                  key={p.uid || p.id}
                  onClick={() => navigate(`/catalog/product/${encodeURIComponent(p.uid)}`)}
                  className="flex items-center justify-between pl-0 pr-5 py-3 w-full min-h-[92px] rounded-[10px] overflow-hidden border border-[#F6F3F3] bg-[linear-gradient(22deg,rgba(255,255,255,1)_0%,rgba(254,159,159,0.35)_100%)]"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="bg-white rounded-[10px] p-2.5 flex items-center justify-center w-[70px] h-[70px] ml-2 shrink-0">
                      {p.imageList?.[0]?.imageBase64 ? (
                        <img
                          src={`data:${p.imageList[0].contentType || "image/png"};base64,${p.imageList[0].imageBase64}`}
                          alt={p.productName}
                          className="object-contain w-[55px] h-[55px]"
                        />
                      ) : (
                        <div className="w-[55px] h-[55px] bg-[#FFF5F5] rounded-md flex items-center justify-center text-[#B20605] text-xl">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-1 text-left min-w-0 flex-1">
                      <span className="font-medium text-[15px] text-[#1A0000] leading-tight truncate w-full">
                        {p.productName}
                      </span>
                      {p.category && (
                        <span className="text-[11px] text-[#606060]">{p.category}</span>
                      )}
                      <span className="text-[#B20605] text-[14px] font-bold">
                        {rupiah(p.price)}
                      </span>
                      {p.stock != null && (
                        <span className="text-[10px] text-[#606060]">Stok: {p.stock}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
