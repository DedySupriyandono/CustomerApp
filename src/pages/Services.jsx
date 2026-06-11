import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench, Search, Tag } from "lucide-react";
import api from "../api/api";
import { rupiah } from "../utils/format";

export default function Services() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/customer/services", { params: search ? { search } : {} })
      .then((r) => setData(Array.isArray(r.data) ? r.data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div
      className="mobile-container relative shadow-2xl pb-24"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[160px] bg-gradient-to-b from-[#540101] to-[#2A0000] z-0" />

      <div className="relative z-10">
        <header className="flex items-center gap-3.5 px-5 pt-12 pb-5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-base font-bold">Layanan Jasa</h1>
        </header>

        <div className="px-5 pb-3">
          <div className="bg-white rounded-full px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari layanan jasa..."
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>
        </div>

        <section className="bg-[#FBF9F9] rounded-t-[20px] min-h-[calc(100vh-200px)] px-4 pt-4">
          {loading ? (
            <div className="text-center text-gray-400 py-12 text-sm">Memuat...</div>
          ) : data.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">
              <Wrench className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              Belum ada layanan jasa tersedia.
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/services/${p.uid}`)}
                  className="w-full text-left bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3] flex gap-3 items-center hover:border-[#B20605] transition"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#FFF5F5] flex items-center justify-center shrink-0">
                    <Wrench className="w-6 h-6 text-[#B20605]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px] text-[#1A0000] truncate">
                      {p.productName}
                    </div>
                    {p.categoryName && (
                      <div className="text-[11px] text-[#606060] mt-0.5 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {p.categoryName}
                        {p.brandName && <> · {p.brandName}</>}
                      </div>
                    )}
                    <div className="text-[#B20605] font-bold text-[14px] mt-1">
                      {rupiah(p.salesPrice)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
