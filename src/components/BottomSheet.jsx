import { useEffect } from "react";
import { X } from "lucide-react";

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-[slideUp_.2s_ease-out]"
        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F6F3F3] sticky top-0 bg-white z-10">
          <h2 className="font-bold text-[16px] text-[#1A0000]">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FFF5F5] flex items-center justify-center text-[#B20605]"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  );
}
