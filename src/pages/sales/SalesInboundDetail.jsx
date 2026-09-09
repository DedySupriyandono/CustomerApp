import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, PackageOpen, ChevronDown, ChevronUp } from "lucide-react";
import salesApi from "../../api/salesApi";
import SalesBottomNav from "../../components/SalesBottomNav";
import { rupiah } from "../../utils/format";

// Detail penerimaan barang — header + lines + SN per line dgn harga snapshot.
// Endpoint: GET /api/sales/outbounds/{uid}
export default function SalesInboundDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openLines, setOpenLines] = useState({}); // detailId -> bool

  useEffect(() => {
    setLoading(true); setError("");
    salesApi.get(`/sales/outbounds/${uid}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || e.message || "Gagal memuat"))
      .finally(() => setLoading(false));
  }, [uid]);

  const toggleLine = (id) => setOpenLines((s) => ({ ...s, [id]: !s[id] }));

  const header = data?.header;
  const lines  = data?.lines || [];
  const sns    = data?.sns   || [];
  const snsByLine = sns.reduce((acc, s) => {
    (acc[s.detailId] ||= []).push(s);
    return acc;
  }, {});
  const totalValue = sns.reduce((sum, s) => sum + (Number(s.snapshotSalesPrice) || 0), 0);

  return (
    <div
      className="mobile-container relative shadow-2xl pb-28"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[160px] bg-gradient-to-b from-[#1A0000] via-[#350000] to-[#540101] z-0" />

      <div className="relative z-10">
        <header className="px-5 pt-12 pb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-lg font-bold">Detail Penerimaan</h1>
        </header>

        <section className="px-5 -mt-2 space-y-3">
          {loading && (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-[#F6F3F3]">
              Memuat...
            </div>
          )}
          {!loading && error && (
            <div className="bg-red-50 rounded-2xl p-4 text-center text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}

          {!loading && !error && header && (
            <>
              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3]">
                <div className="flex items-center gap-2 mb-2">
                  <PackageOpen className="w-5 h-5 text-[#B20605]" />
                  <p className="font-bold text-[#1A0000] text-[16px]">{header.outboundNo}</p>
                </div>
                <InfoRow label="Dari Gudang" value={header.warehouseName || "-"} />
                <InfoRow label="Tanggal" value={header.closedAt ? new Date(header.closedAt).toLocaleString("id-ID") : "-"} />
                <InfoRow label="No Ref" value={header.refNo || "-"} />
                {header.description && (
                  <InfoRow label="Keterangan" value={header.description} />
                )}
                <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Total Nilai Snapshot</span>
                  <span className="text-[#B20605] font-bold text-[16px]">{rupiah(totalValue)}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3]">
                <h3 className="font-bold text-[#1A0000] text-sm mb-3">Detail Produk & SN</h3>
                {lines.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">Tidak ada line</p>
                )}
                {lines.map((ln) => {
                  const snList = snsByLine[ln.detailId] || [];
                  const isOpen = !!openLines[ln.detailId];
                  const distinctPrices = [...new Set(snList.map((s) => Number(s.snapshotSalesPrice) || 0))].sort((a, b) => a - b);
                  return (
                    <div key={ln.detailId} className="border border-gray-100 rounded-xl mb-2 overflow-hidden">
                      <button
                        onClick={() => toggleLine(ln.detailId)}
                        className="w-full p-3 flex justify-between items-start text-left hover:bg-gray-50"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-semibold text-[#1A0000] text-[14px] truncate">{ln.productName}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{ln.productNumber}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {distinctPrices.length === 0 ? null :
                              distinctPrices.length === 1 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-semibold">
                                  {rupiah(distinctPrices[0])}
                                </span>
                              ) : (
                                distinctPrices.map((p) => (
                                  <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-semibold">
                                    {rupiah(p)}
                                  </span>
                                ))
                              )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[13px] font-bold text-[#B20605]">{ln.quantity} SN</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-gray-100 bg-gray-50 max-h-[280px] overflow-y-auto">
                          {snList.length === 0 && (
                            <p className="text-center text-gray-400 text-xs p-3">Belum ada SN</p>
                          )}
                          {snList.map((s, idx) => (
                            <div key={idx} className="px-3 py-2 border-b border-gray-100 last:border-0 flex justify-between items-center text-[12px]">
                              <code className="text-gray-700 truncate max-w-[60%]">{s.qrCode || s.productNameValue || "-"}</code>
                              <span className="font-semibold text-[#1A0000]">{rupiah(s.snapshotSalesPrice)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      <SalesBottomNav />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 text-[13px]">
      <span className="text-gray-500">{label}</span>
      <span className="text-[#1A0000] font-medium text-right">{value}</span>
    </div>
  );
}
