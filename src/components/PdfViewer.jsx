import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Worker bundled lewat Vite ?url — supaya PDF tetap render saat offline /
// di PWA (tidak depend ke CDN). pdf.worker.min.mjs di-resolve dari
// node_modules/pdfjs-dist/build dan ikut ke dist/.
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// PdfViewer — render PDF pakai react-pdf (canvas based). Cocok untuk PWA
// karena tidak depend ke browser inline-PDF support (iOS Safari/PWA biasanya
// menolak iframe blob:application/pdf, ini bypass via canvas rendering).
//
// Props:
//   file: blob URL atau Uint8Array atau string base64-data-url. Disarankan
//         pass {data: bytes} agar tidak depend ke browser's blob behavior.
//   onLoadError: callback kalau load gagal.
export default function PdfViewer({ file, onLoadError }) {
  const containerRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(0);
  const [err, setErr] = useState("");

  // Hitung lebar container utk auto-scale page.
  useEffect(() => {
    const calcWidth = () => {
      if (containerRef.current) {
        // 24px padding (12 kiri-kanan).
        setWidth(Math.max(280, containerRef.current.clientWidth - 24));
      }
    };
    calcWidth();
    window.addEventListener("resize", calcWidth);
    return () => window.removeEventListener("resize", calcWidth);
  }, []);

  return (
    <div ref={containerRef} className="pdf-viewer-container" style={{ width: "100%", padding: "12px" }}>
      {err && (
        <div className="text-red-600 text-sm text-center py-6">{err}</div>
      )}
      <Document
        file={file}
        loading={
          <div className="text-center text-gray-400 text-sm py-12">Memuat PDF…</div>
        }
        onLoadSuccess={({ numPages }) => { setNumPages(numPages); setErr(""); }}
        onLoadError={(e) => {
          const msg = e?.message || String(e);
          setErr("Gagal load PDF: " + msg);
          onLoadError?.(e);
        }}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div
            key={`page_${i + 1}`}
            style={{ marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          >
            <Page
              pageNumber={i + 1}
              width={width || undefined}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        ))}
      </Document>
      {numPages > 0 && (
        <div className="text-center text-gray-400 text-xs py-3">
          {numPages} halaman
        </div>
      )}
    </div>
  );
}
