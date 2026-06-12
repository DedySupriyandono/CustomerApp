import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Download, Share, X } from "lucide-react";

// PWA install prompt — auto detect & tampilkan tombol Install.
// Portal-aware: customer ("/") dan sales ("/sales") install sebagai
// dua PWA terpisah — manifest beda, dismiss key beda. Banner hanya
// muncul di portal yang sesuai dgn URL saat ini.
//
// Android Chrome:
//   beforeinstallprompt event → tampung deferredPrompt; klik tombol → prompt().
// iOS Safari:
//   tidak ada API install. Kasih instruksi: Share → Add to Home Screen.
//
// Sembunyikan kalau:
//   - sudah standalone (display-mode atau navigator.standalone)
//   - user pernah dismiss dalam 7 hari terakhir (localStorage, per-portal)

const DISMISS_KEY_PREFIX = "pwa-install-dismissed-at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari pakai navigator.standalone
  if (window.navigator.standalone === true) return true;
  return false;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;
}

function isRecentlyDismissed(portal) {
  try {
    const v = localStorage.getItem(`${DISMISS_KEY_PREFIX}-${portal}`);
    if (!v) return false;
    return Date.now() - Number(v) < DISMISS_MS;
  } catch (e) {
    return false;
  }
}

export default function InstallPrompt() {
  const { pathname } = useLocation();
  const portal = pathname.startsWith("/sales") ? "sales" : "customer";
  const portalName = portal === "sales" ? "Sales Belanja Yuk" : "Belanja Yuk";

  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    // Saat pindah portal: reset visible state. Banner di portal baru akan
    // bangkit kalau memenuhi syarat.
    setShow(false);
    setShowIosHint(false);
    setDeferred(null);

    if (isStandalone()) return;
    if (isRecentlyDismissed(portal)) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS tidak fire beforeinstallprompt → fallback tampil hint setelah 3 detik.
    let iosTimer = null;
    if (isIos()) {
      iosTimer = setTimeout(() => {
        if (!isStandalone()) setShow(true);
      }, 3000);
    }

    const installedHandler = () => {
      setShow(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [portal]);

  const dismiss = () => {
    try { localStorage.setItem(`${DISMISS_KEY_PREFIX}-${portal}`, String(Date.now())); } catch (e) {}
    setShow(false);
    setShowIosHint(false);
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setShow(false);
        setDeferred(null);
      }
    } else if (isIos()) {
      setShowIosHint(true);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Banner bawah */}
      <div
        className="fixed bottom-20 left-3 right-3 z-50 bg-white rounded-2xl shadow-2xl border border-[#F6F3F3] p-3 flex items-center gap-3"
        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
      >
        <img src="/pwa-192.png" alt="" className="w-10 h-10 rounded-lg" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-[#1A0000] truncate">Install {portalName}</div>
          <div className="text-[11px] text-gray-500 truncate">
            {isIos()
              ? "Tap untuk lihat cara install"
              : "Akses lebih cepat dari home screen"}
          </div>
        </div>
        <button
          onClick={install}
          className="inline-flex items-center gap-1.5 bg-[#B20605] text-white text-[12px] font-semibold px-3 py-2 rounded-lg shrink-0"
        >
          <Download className="w-4 h-4" /> Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Tutup"
          className="w-8 h-8 inline-flex items-center justify-center text-gray-400 rounded-full shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* iOS instruksi modal */}
      {showIosHint && (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-black/40"
          onClick={() => setShowIosHint(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-2xl w-full p-5 max-w-md mx-auto"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-[15px] text-[#1A0000]">Cara Install di iPhone/iPad</div>
              <button onClick={() => setShowIosHint(false)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-3 text-[13px] text-[#1A0000]">
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#FFF0E6] text-[#E87B1E] font-bold text-[12px] flex items-center justify-center">1</span>
                <span>
                  Tap tombol <Share className="inline w-4 h-4 mx-1 text-blue-500" />
                  <b>Share</b> di Safari (bagian bawah).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#FFF0E6] text-[#E87B1E] font-bold text-[12px] flex items-center justify-center">2</span>
                <span>Scroll bawah, pilih <b>Add to Home Screen</b> (Tambah ke Layar Utama).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#FFF0E6] text-[#E87B1E] font-bold text-[12px] flex items-center justify-center">3</span>
                <span>Tap <b>Add</b> di pojok kanan atas.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosHint(false)}
              className="mt-5 w-full bg-[#B20605] text-white font-semibold py-3 rounded-xl"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
