import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, AlertTriangle } from "lucide-react";
import salesApi from "../../api/salesApi";
import PdfViewer from "../../components/PdfViewer";

// Buku Manual viewer (Sales) — render canvas via react-pdf (PWA-safe).
// Source: GET /sales/manual → { base64, contentType, fileName }
export default function SalesManual() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState(null);
  const [bytes, setBytes] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    salesApi
      .get("/sales/manual")
      .then((r) => {
        const data = r.data;
        setMeta(data);
        if (!data?.base64) {
          setError("File manual ada tapi belum di-encode base64. Hubungi admin.");
          return;
        }
        try {
          const byteChars = atob(data.base64);
          const arr = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) arr[i] = byteChars.charCodeAt(i);
          setBytes(arr);
        } catch (e) {
          setError("Gagal decode base64: " + (e.message || e));
        }
      })
      .catch((e) => setError(e.response?.data?.message || e.message || "Gagal memuat manual"))
      .finally(() => setLoading(false));
  }, []);

  const pdfFile = useMemo(
    () => (bytes ? { data: bytes } : null),
    [bytes]
  );

  const downloadFile = () => {
    if (!bytes) return;
    const blob = new Blob([bytes], { type: meta?.contentType || "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta?.fileName || "buku-manual-sales.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div
      className="mobile-container relative shadow-2xl"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', minHeight: "100vh" }}
    >
      <header className="flex items-center justify-between px-5 pt-12 pb-4 bg-gradient-to-b from-[#540101] to-[#2A0000]">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-base font-bold leading-[26px]">Buku Manual</h1>
        </div>
        {bytes && (
          <button
            onClick={downloadFile}
            aria-label="Download"
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
        )}
      </header>

      {meta?.title && (
        <div className="bg-white px-5 py-3 border-b border-[#F6F3F3]">
          <p className="text-[14px] font-bold text-[#1A0000]">{meta.title}</p>
          {meta.snippet && <p className="text-[11px] text-gray-500 mt-0.5">{meta.snippet}</p>}
        </div>
      )}

      <div className="bg-[#FBF9F9] pb-8" style={{ minHeight: "calc(100vh - 140px)" }}>
        {loading && (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <div className="text-gray-400 text-sm">Memuat manual…</div>
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-10 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {!loading && !error && pdfFile && <PdfViewer file={pdfFile} />}
      </div>
    </div>
  );
}
