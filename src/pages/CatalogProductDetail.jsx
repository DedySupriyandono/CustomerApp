import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, Tag, Sparkles } from "lucide-react";
import api from "../api/api";
import { rupiah } from "../utils/format";
import { describePromos, lineWithPromo, promoLabel } from "../utils/promo";

// Detail produk untuk halaman Catalog (browsing-only).
// Dipisah dari ProductDetail.jsx karena di Catalog customer hanya
// melihat informasi produk — tidak ada tombol Keranjang / checkout.
// Order via Catalog dilakukan dengan rute lain (OrderProducts → /product/:uid).
export default function CatalogProductDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/customer/products/Details/${encodeURIComponent(uid)}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || e.message || "Gagal memuat produk"))
      .finally(() => setLoading(false));
  }, [uid]);

  const isKartuPerdana = useMemo(
    () => data?.category?.toLowerCase().includes("kartu perdana"),
    [data]
  );

  const stock = data?.stock ?? 0;
  const price = data?.price ?? 0;
  const promos = data?.activePromos || [];
  // Simulasi untuk display ladder promo (qty=1 default).
  const sampleQty = 1;
  const { active: activePromo } = describePromos(promos, sampleQty);
  const line = lineWithPromo(price, sampleQty, promos);

  if (loading) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen text-gray-400">
        Memuat...
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen text-red-600 p-6 text-center">
        {error || "Produk tidak ditemukan"}
      </div>
    );
  }

  const images = data.imageList || [];
  const mainImage = images[activeImg];

  return (
    <div
      className="mobile-container relative shadow-2xl"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b from-[#540101] to-[#2A0000] z-0" />

      <div className="relative z-10 pb-10">
        <header className="flex items-center justify-between px-5 pt-12 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-base font-bold leading-[26px] truncate max-w-[200px]">
              Detail Produk
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/notifications")} aria-label="Notifikasi" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>
          </div>
        </header>

        <section className="bg-[#FBF9F9] rounded-t-[20px] -mt-2 min-h-[calc(100vh-180px)] px-5 pt-[18px]">
          {/* Main image */}
          <div className="bg-white rounded-2xl p-4 flex items-center justify-center w-full aspect-square mb-3 border border-[#F6F3F3]">
            {mainImage?.imageBase64 ? (
              <img
                src={`data:${mainImage.contentType || "image/png"};base64,${mainImage.imageBase64}`}
                alt={data.productName}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-[#B20605] text-6xl">📦</div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 bg-white ${
                    i === activeImg ? "border-[#B20605]" : "border-[#F6F3F3]"
                  }`}
                >
                  {img.imageBase64 && (
                    <img
                      src={`data:${img.contentType || "image/png"};base64,${img.imageBase64}`}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Title + price */}
          <h2 className="font-bold text-[18px] text-[#1A0000] leading-tight">
            {data.productName}
          </h2>
          <div className="text-[#606060] text-[12px] mt-1">⭐ Stock {stock}</div>
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-[#B20605] font-bold text-[24px]">{rupiah(price)}</div>
            {promos.length > 0 && (
              <span className="bg-[#FFF0E6] text-[#E87B1E] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Promo
              </span>
            )}
          </div>

          {/* Promo ladder (read-only) */}
          {promos.length > 0 && (
            <div className="mt-3 bg-[#FFF8E1] border border-[#FFE0A6] rounded-xl p-3">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#E87B1E] uppercase tracking-wider mb-2">
                <Tag className="w-3.5 h-3.5" /> Promo Tersedia
              </div>
              <div className="space-y-1.5">
                {promos.map((p) => {
                  const isActive = activePromo && activePromo.id === p.id;
                  const min = p.minQuantity ?? 1;
                  const max = p.maxQuantity;
                  const range = max ? `min ${min}–${max}` : `min ${min}`;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between text-[12px] ${
                        isActive ? "font-semibold text-green-700" : "text-[#1A0000]"
                      }`}
                    >
                      <span>
                        ○ {promoLabel(p)}{" "}
                        <span className="text-[#606060]">({range} pcs)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <hr className="my-4 border-[#F6F3F3]" />

          {/* Detail */}
          <div className="space-y-2 text-[13px]">
            <Row label="Kondisi" value="Baru" />
            <Row label="Kategori" value={data.category || "-"} />
            {data.brand && <Row label="Brand" value={data.brand} />}
            {data.branch && <Row label="Cabang" value={data.branch} />}
            {data.description && (
              <div className="pt-2">
                <div className="text-[#606060] mb-1">Deskripsi:</div>
                <p className="text-[#1A0000]">{data.description}</p>
              </div>
            )}
          </div>

          {/* Kartu Perdana → tampilkan list nomor read-only */}
          {isKartuPerdana && (
            <>
              <h3 className="font-semibold text-[15px] text-[#1A0000] mt-5 mb-2">
                Nomor Tersedia
              </h3>
              <div className="bg-white rounded-xl border border-[#F6F3F3] max-h-[260px] overflow-y-auto divide-y divide-[#F6F3F3]">
                {data.stockList?.length ? (
                  data.stockList.map((s) => (
                    <div key={s.id} className="px-4 py-3">
                      <span className="font-mono text-[14px] text-[#1A0000]">
                        {s.productNameValue}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-400 text-sm">
                    Tidak ada nomor tersedia
                  </div>
                )}
              </div>
            </>
          )}

          {/* Info */}
          <div className="mt-5 bg-[#FFF5F5] border border-[#FECECE] rounded-xl p-3 text-[12px] text-[#1A0000]">
            ℹ {data.info || "Halaman katalog hanya menampilkan informasi produk."}
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#606060]">{label}</span>
      <span className="text-[#1A0000] font-medium">{value}</span>
    </div>
  );
}
