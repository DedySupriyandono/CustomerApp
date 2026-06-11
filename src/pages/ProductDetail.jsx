import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, ShoppingCart, Tag, Sparkles } from "lucide-react";
import Swal from "sweetalert2";
import api from "../api/api";
import { useCart } from "../contexts/CartContext";
import QuantityStepper from "../components/QuantityStepper";
import { rupiah } from "../utils/format";
import { describePromos, lineWithPromo, promoLabel } from "../utils/promo";

export default function ProductDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { setQty, addSerial, items, totalItems } = useCart();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQtyLocal] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSerials, setSelectedSerials] = useState([]);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/customer/products/Details/${encodeURIComponent(uid)}`)
      .then((r) => {
        console.log("[ProductDetail]", r.data);
        setData(r.data);
      })
      .catch((e) => {
        console.error(e);
        setError(e.response?.data?.message || e.message || "Gagal memuat produk");
      })
      .finally(() => setLoading(false));
  }, [uid]);

  const isKartuPerdana = useMemo(
    () => data?.category?.toLowerCase().includes("kartu perdana"),
    [data]
  );

  const stock = data?.stock ?? 0;
  const price = data?.price ?? 0;
  const effectiveQty = isKartuPerdana ? selectedSerials.length : qty;
  const promos = data?.activePromos || [];
  const { active: activePromo, next: nextPromo } = describePromos(promos, effectiveQty);
  const line = lineWithPromo(price, effectiveQty, promos);
  const subtotal = line.subtotal; // already discounted

  const toggleSerial = (value) => {
    setSelectedSerials((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleAddToCart = () => {
    if (!data) return;

    const cartProduct = {
      id: data.id,
      productName: data.productName,
      productCode: data.uid,
      salesPrice: data.price ?? 0,
      imageBase64: data.imageList?.[0]?.imageBase64,
      imageContentType: data.imageList?.[0]?.contentType,
      promos: data.activePromos || [],
    };

    if (isKartuPerdana) {
      if (selectedSerials.length === 0) {
        alert("Pilih minimal satu nomor perdana");
        return;
      }
      addSerial(cartProduct, selectedSerials);
    } else {
      if (qty <= 0) return;
      setQty(cartProduct, qty);
    }
    navigate(-1);
  };

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

      <div className="relative z-10 pb-32">
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

          {/* Promo simulation block */}
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
                        {isActive ? "✓ " : "○ "}
                        {promoLabel(p)} <span className="text-[#606060]">({range} pcs)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              {effectiveQty > 0 && activePromo && (
                <div className="mt-2 pt-2 border-t border-dashed border-[#FFE0A6] text-[11px] text-green-700 font-semibold">
                  Anda hemat {rupiah(line.discountPerUnit * effectiveQty)} untuk {effectiveQty} pcs
                </div>
              )}
              {nextPromo && effectiveQty > 0 && (
                <div className="mt-1 text-[11px] text-[#E87B1E]">
                  Tambah {(nextPromo.minQuantity ?? 0) - effectiveQty} pcs lagi untuk dapat{" "}
                  <b>{promoLabel(nextPromo)}</b>
                </div>
              )}
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

          {/* Kartu Perdana → serial list */}
          {isKartuPerdana && (
            <>
              <h3 className="font-semibold text-[15px] text-[#1A0000] mt-5 mb-2">
                Pilih Nomor
              </h3>
              <div className="bg-white rounded-xl border border-[#F6F3F3] max-h-[260px] overflow-y-auto divide-y divide-[#F6F3F3]">
                {data.stockList?.length ? (
                  data.stockList.map((s) => {
                    const checked = selectedSerials.includes(s.productNameValue);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSerial(s.productNameValue)}
                          className="w-4 h-4 accent-[#B20605]"
                        />
                        <span className="font-mono text-[14px] text-[#1A0000]">
                          {s.productNameValue}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center text-gray-400 text-sm">
                    Tidak ada nomor tersedia
                  </div>
                )}
              </div>
              <div className="text-[12px] text-[#606060] mt-2">
                Terpilih: <span className="font-semibold text-[#1A0000]">{selectedSerials.length}</span> nomor
              </div>
            </>
          )}

          {/* Non-Kartu Perdana → quantity stepper (editable + validasi stok) */}
          {!isKartuPerdana && (
            <>
              <h3 className="font-semibold text-[15px] text-[#1A0000] mt-5 mb-3">
                Atur Jumlah
              </h3>
              <div className="bg-white rounded-xl border border-[#F6F3F3] p-4 flex items-center justify-between">
                <span className="text-[#606060] text-[13px]">Qty</span>
                <QuantityStepper
                  value={qty}
                  min={1}
                  max={stock > 0 ? stock : 1}
                  editable
                  onValidate={(n) => {
                    if (n > stock) {
                      return `Jumlah melebihi stok yang tersedia (stok: ${stock}).`;
                    }
                    return null;
                  }}
                  onChange={(v) => {
                    if (v > stock) {
                      Swal.fire({
                        icon: "warning",
                        title: "Melebihi stok",
                        text: `Jumlah melebihi stok yang tersedia (stok: ${stock}).`,
                        confirmButtonColor: "#B20605",
                      });
                      return;
                    }
                    setQtyLocal(Math.max(1, v));
                  }}
                />
              </div>
            </>
          )}

          {/* Info */}
          <div className="mt-5 bg-[#FFF5F5] border border-[#FECECE] rounded-xl p-3 text-[12px] text-[#1A0000]">
            ℹ {data.info || "Product yang di beli tidak bisa dikembalikan"}
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 z-40">
        <div className="flex-1">
          <div className="text-[11px] text-gray-500">Subtotal</div>
          {activePromo && line.discountPerUnit > 0 ? (
            <div>
              <span className="line-through text-gray-400 text-[11px] mr-1">
                {rupiah(price * effectiveQty)}
              </span>
              <span className="font-bold text-[#B20605] text-[16px]">{rupiah(subtotal)}</span>
            </div>
          ) : (
            <div className="font-bold text-[#1A0000] text-[16px]">{rupiah(subtotal)}</div>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={effectiveQty === 0}
          className="bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-semibold px-6 py-3 rounded-full shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          + Keranjang
        </button>
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
