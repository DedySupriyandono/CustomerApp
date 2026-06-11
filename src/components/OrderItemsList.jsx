import { useMemo, useState } from "react";
import { ChevronDown, Hash, Lock, Trash2 } from "lucide-react";
import { groupOrderItems, isVoucherCategory } from "../utils/orderItems";
import { rupiah } from "../utils/format";

/**
 * Order items renderer with auto-grouping. Items that share productName +
 * unitPrice (e.g. Kartu Perdana with one row per phone number) get collapsed
 * into one accordion row that expands to show the individual SN list.
 *
 * Props:
 *   - items: order items array
 *   - defaultOpen: open all groups by default (used for invoice/print)
 *   - mono: render SN values in monospace
 *   - onDelete: optional (itemId, item) => void. When provided, a trash icon
 *               appears on each row. Parent handles confirmation + API call.
 *   - deletingId: itemId currently being removed (shows a spinner / disables button)
 */
export default function OrderItemsList({ items, defaultOpen = false, mono = true, orderStatus = null, onDelete = null, deletingId = null }) {
  const groups = useMemo(() => groupOrderItems(items), [items]);
  const [open, setOpen] = useState({});

  // Voucher SN baru ditampilkan setelah order Selesai. Untuk Kartu Perdana,
  // tampil selalu (customer yg pilih sendiri).
  const isSelesai = orderStatus === "Selesai";
  const shouldMaskSn = (categoryName) => isVoucherCategory(categoryName) && !isSelesai;

  const isOpen = (key) => (defaultOpen ? !open[`__closed_${key}`] : !!open[key]);
  const toggle = (key) =>
    setOpen((prev) =>
      defaultOpen
        ? { ...prev, [`__closed_${key}`]: !prev[`__closed_${key}`] }
        : { ...prev, [key]: !prev[key] }
    );

  return (
    <div className="divide-y divide-[#F6F3F3]">
      {groups.map((g) => {
        const masked = shouldMaskSn(g.categoryName);
        if (!g.isGrouped) {
          const it = g.rows[0];
          const lineDiscount = Number(it.discount) || 0;
          const hasPromo = lineDiscount > 0;
          const unitNet = hasPromo && it.quantity ? it.unitPrice - lineDiscount / it.quantity : it.unitPrice;
          return (
            <div key={g.key} className="py-3 flex justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#1A0000] truncate">
                  {it.productName}
                </div>
                {it.productCode && (
                  masked ? (
                    <div className="text-[11px] text-orange-600 mt-0.5 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Kode tampil setelah selesai
                    </div>
                  ) : (
                    <div className={`text-[11px] text-[#606060] mt-0.5 ${mono ? "font-mono" : ""}`}>
                      {it.productCode}
                    </div>
                  )
                )}
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {hasPromo ? (
                    <>
                      <span className="line-through">{rupiah(it.unitPrice)}</span>{" "}
                      <span className="text-[#B20605]">{rupiah(unitNet)}</span> × {it.quantity}
                    </>
                  ) : (
                    <>{rupiah(it.unitPrice)} × {it.quantity}</>
                  )}
                </div>
                {hasPromo && (
                  <div className="mt-1 inline-flex items-center bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-200">
                    🎁 Hemat {rupiah(lineDiscount)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-[13px] font-semibold text-[#1A0000]">
                  {rupiah(it.subtotal)}
                </div>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(it.id, it)}
                    disabled={deletingId === it.id}
                    title="Hapus item"
                    className="w-7 h-7 rounded-md bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        }

        const opened = isOpen(g.key);
        return (
          <div key={g.key} className="py-3">
            <button
              type="button"
              onClick={() => toggle(g.key)}
              className="w-full flex items-center gap-2 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#1A0000] truncate">
                  {g.productName}
                </div>
                <div className="text-[11px] text-[#606060] mt-0.5 flex items-center gap-1 flex-wrap">
                  <span className="bg-[#FFF5F5] text-[#B20605] px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    {g.rows.length} nomor
                  </span>
                  <span>· {rupiah(g.unitPrice)} / pcs</span>
                  {g.totalDiscount > 0 && (
                    <span className="bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      🎁 Hemat {rupiah(g.totalDiscount)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[13px] font-semibold text-[#1A0000] shrink-0">
                {rupiah(g.totalSubtotal)}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#B20605] shrink-0 transition-transform ${
                  opened ? "rotate-180" : ""
                }`}
              />
            </button>

            {opened && (
              <div className="mt-3 ml-1 pl-3 border-l-2 border-[#FECECE] space-y-1.5">
                {masked && (
                  <div className="text-[11px] text-orange-600 flex items-center gap-1 mb-1">
                    <Lock className="w-3 h-3" /> Kode tampil setelah order Selesai
                  </div>
                )}
                {g.rows.map((r, idx) => (
                  <div key={r.id ?? `${g.key}-${idx}`} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {masked ? <Lock className="w-3 h-3 text-orange-500 shrink-0" /> : <Hash className="w-3 h-3 text-[#B20605] shrink-0" />}
                      <span
                        className={`text-[12px] truncate ${
                          masked ? "text-orange-500 tracking-widest" : `text-[#1A0000] ${mono ? "font-mono" : ""}`
                        }`}
                      >
                        {masked ? "•••• •••• ••••" : (r.productCode || "—")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] text-[#606060]">
                        {rupiah(r.subtotal)}
                      </span>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(r.id, r)}
                          disabled={deletingId === r.id}
                          title="Hapus item"
                          className="w-6 h-6 rounded-md bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 disabled:opacity-40"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
