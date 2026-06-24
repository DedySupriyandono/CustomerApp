import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, ShoppingCart, Search, SlidersHorizontal, Warehouse } from "lucide-react";
import salesApi from "../../api/salesApi";
import SalesBottomNav from "../../components/SalesBottomNav";
import { useSalesCart } from "../../contexts/SalesCartContext";
import { rupiah } from "../../utils/format";

export default function SalesOrderProducts() {
  const navigate = useNavigate();
  const { totalItems, warehouse, setWarehouse, items, clear } = useSalesCart();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Warehouse picker: list warehouses milik area sales force.
  const [warehouses, setWarehouses] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    // Load list warehouse 1x. Backend filter ke warehouse_id sales login,
    // jadi list ini biasanya cuma 1 item → auto-pick. Picker tetap di-render
    // (tombol Ubah di-disabled) supaya feature gampang dibuka kembali nanti.
    salesApi.get("/sales/warehouses")
      .then((r) => setWarehouses(Array.isArray(r.data) ? r.data : []))
      .catch(() => setWarehouses([]));
  }, []);

  // Auto-pick warehouse sales login. Kalau cuma 1 (kasus normal locked),
  // langsung set tanpa buka picker. Kalau >1 (sales tanpa warehouse_id),
  // baru buka picker.
  //
  // Defensive: kalau warehouse di state (dari localStorage) gak ada di
  // response /sales/warehouses (mis. user ganti login dari sales lain),
  // override dgn yg dari API. Mencegah "stuck" pakai gudang user lama.
  useEffect(() => {
    if (warehouses.length === 0) return;
    const matches = warehouse?.id && warehouses.some((w) => w.id === warehouse.id);
    if (warehouse && matches) return;
    if (warehouses.length === 1) {
      setWarehouse(warehouses[0]);
    } else {
      // Multi pilihan: kalau warehouse lama ada di list, biarkan; kalau
      // tidak — clear & buka picker.
      if (warehouse && !matches) setWarehouse(null);
      setPickerOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouses]);

  // Fetch products tergantung warehouse — kalau belum dipilih, tampilkan empty state.
  useEffect(() => {
    if (!warehouse?.id) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    salesApi
      .get("/sales/products/GetAll", { params: { warehouseId: warehouse.id } })
      .then((r) => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch((e) => setError(e.response?.data?.message || e.message || "Gagal memuat produk"))
      .finally(() => setLoading(false));
  }, [warehouse?.id]);

  // Konfirmasi ganti gudang: kalau cart tidak kosong, peringatkan akan kosongkan cart.
  const handlePickWarehouse = (wh) => {
    if (warehouse?.id === wh.id) { setPickerOpen(false); return; }
    if (items.length > 0) {
      const ok = window.confirm(
        `Cart saat ini berisi ${items.length} produk dari "${warehouse?.name}". ` +
        `Ganti gudang akan mengosongkan cart. Lanjut?`
      );
      if (!ok) return;
      clear();
    }
    setWarehouse({ id: wh.id, name: wh.name, code: wh.code });
    setPickerOpen(false);
  };

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) =>
        p.productName?.toLowerCase().includes(t) || p.category?.toLowerCase().includes(t)
    );
  }, [products, search]);

  return (
    <div
      className="mobile-container relative shadow-2xl"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b from-[#1A0000] via-[#350000] to-[#540101] z-0" />

      <div className="relative z-10 pb-28">
        <header className="flex items-center justify-between px-5 pt-12 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-base font-bold">Order Produk</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/sales/notifications")}
              aria-label="Notifikasi"
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>
            <button
              onClick={() => navigate("/sales/checkout")}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B20605] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </header>

        <section className="bg-[#FBF9F9] rounded-t-[20px] -mt-2 min-h-[calc(100vh-180px)] px-5 pt-[18px]">
          {/* Warehouse picker chip — selalu tampil di atas. Klik = buka picker. */}
          {/* Tombol Ubah gudang DISABLED — sales locked ke warehouse login.
              Untuk buka kembali: ganti div ke button + setPickerOpen(true)
              di onClick + un-comment tombol Ubah. */}
          <div
            className="flex items-center justify-between gap-3 w-full mb-4 px-4 py-3 rounded-[10px] bg-white border border-[#F6F3F3] shadow-sm opacity-90"
            aria-disabled="true"
          >
            <span className="flex items-center gap-3 text-left min-w-0">
              <span className="w-9 h-9 rounded-full bg-[#FFF5F5] flex items-center justify-center shrink-0">
                <Warehouse className="w-5 h-5 text-[#B20605]" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-[11px] text-[#606060] leading-tight">Gudang</span>
                <span className="text-[14px] font-bold text-[#1A0000] truncate">
                  {warehouse?.name || "Memuat..."}
                </span>
              </span>
            </span>
            {/* <span className="text-[#B20605] text-xs font-semibold">Ubah</span> */}
            <span className="text-[#9CA3AF] text-xs font-medium">Terkunci</span>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-4 w-full">
            <label className="relative flex-1 h-12 bg-white rounded-[10px] border border-[#F6F3F3]">
              <div className="absolute top-1/2 -translate-y-1/2 left-1 bg-[#FFF5F5] p-[7px] rounded-lg">
                <Search className="w-[18px] h-[18px] text-[#B20605]" />
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="absolute inset-0 pl-[52px] pr-3 text-sm text-[#1A0000] placeholder:text-[#606060] focus:outline-none rounded-[10px] bg-transparent"
              />
            </label>
            <button
              type="button"
              className="p-2.5 rounded-[10px] bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)]"
            >
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </button>
          </form>

          <div className="flex flex-col items-start gap-4 w-full mt-6">
            {loading && <div className="w-full text-center text-gray-400 py-12 text-sm">Memuat...</div>}
            {!loading && error && <div className="w-full text-center text-red-600 py-12 text-sm">{error}</div>}
            {!loading && !error && filtered.length === 0 && (
              <div className="w-full text-center text-gray-400 py-12 text-sm">Tidak ada produk</div>
            )}

            {!loading &&
              filtered.map((p) => (
                <button
                  key={p.uid || p.id}
                  onClick={() => navigate(`/sales/product/${encodeURIComponent(p.uid)}`)}
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
                        <div className="w-[55px] h-[55px] bg-[#FFF5F5] rounded-md flex items-center justify-center text-[#B20605] text-xl">📦</div>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-1 text-left min-w-0 flex-1">
                      <span className="font-medium text-[15px] text-[#1A0000] leading-tight truncate w-full">
                        {p.productName}
                      </span>
                      {p.category && <span className="text-[11px] text-[#606060]">{p.category}</span>}
                      <span className="text-[#B20605] text-[14px] font-bold">{rupiah(p.price)}</span>
                      {p.stock != null && <span className="text-[10px] text-[#606060]">Stok: {p.stock}</span>}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </section>
      </div>

      <SalesBottomNav />

      {/* Warehouse picker modal — sheet-style bottom modal. */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
          onClick={() => warehouse && setPickerOpen(false)}
        >
          <div
            className="w-full max-w-[480px] bg-white rounded-t-[20px] p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-bold text-[#1A0000]">Pilih Gudang</h3>
              {warehouse && (
                <button
                  onClick={() => setPickerOpen(false)}
                  className="text-[#B20605] text-sm font-semibold"
                >Tutup</button>
              )}
            </div>
            <p className="text-[12px] text-[#606060] mb-3">
              1 order hanya boleh dari 1 gudang. Stok yang muncul akan disesuaikan
              dengan gudang yang dipilih.
            </p>
            {warehouses.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                Tidak ada gudang aktif di area Anda.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {warehouses.map((w) => (
                  <li key={w.id}>
                    <button
                      onClick={() => handlePickWarehouse(w)}
                      className={`w-full text-left px-4 py-3 rounded-[10px] border ${
                        warehouse?.id === w.id
                          ? "border-[#B20605] bg-[#FFF5F5]"
                          : "border-[#F6F3F3] bg-white"
                      }`}
                    >
                      <div className="font-semibold text-[14px] text-[#1A0000]">{w.name}</div>
                      {w.code && (
                        <div className="text-[11px] text-[#606060]">{w.code}</div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
