import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Share2, Hash, Briefcase } from "lucide-react";
import salesApi from "../../api/salesApi";
import { useSalesAuth } from "../../contexts/SalesAuthContext";
import { rupiah } from "../../utils/format";
import { groupOrderItems } from "../../utils/orderItems";
import logo from "../../assets/belanja-yuk.png";

export default function SalesInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sales } = useSalesAuth();

  const [order, setOrder] = useState(null);
  const [salesMe, setSalesMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      salesApi.get(`/sales/orders/${id}`),
      salesApi.get("/sales/me").catch(() => ({ data: null })),
    ])
      .then(([o, m]) => {
        setOrder(o.data);
        setSalesMe(m.data || sales);
      })
      .catch((e) => setError(e.response?.data?.message || "Gagal memuat invoice"))
      .finally(() => setLoading(false));
  }, [id]);

  const isFinalInvoice = order && ["Diproses", "Diproses Sebagian", "Dikirim", "Tiba", "Selesai", "Selesai Sebagian"].includes(order.status);
  const docLabel = isFinalInvoice ? "Invoice" : "Proforma Invoice";

  const handlePrint = () => window.print();
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${docLabel} ${order?.orderNumber}`,
          text: `${order?.orderNumber} - ${rupiah(order?.total)}`,
          url,
        });
      } catch {}
    } else {
      navigator.clipboard?.writeText(url);
      alert("Link disalin ke clipboard");
    }
  };

  if (loading)
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen text-gray-400">
        Memuat invoice...
      </div>
    );
  if (error || !order)
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen text-red-600 p-6 text-center">
        {error || "Invoice tidak ditemukan"}
      </div>
    );

  // Sales-placed (no customer) vs approved customer order
  const hasCustomer = !!order.customer;
  const buyer = hasCustomer ? order.customer : null;
  const salesUser = salesMe || sales || {};

  return (
    <div
      className="mobile-container relative shadow-2xl pb-24"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <header className="sticky top-0 z-30 bg-white border-b border-[#F6F3F3] px-4 py-3 flex items-center gap-3 print:hidden">
        <button
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="w-9 h-9 rounded-full bg-[#FFF5F5] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-[#B20605]" />
        </button>
        <h1 className="flex-1 text-base font-bold text-[#1A0000]">{docLabel}</h1>
        <button
          onClick={handleShare}
          aria-label="Bagikan"
          className="w-9 h-9 rounded-full bg-[#FFF5F5] flex items-center justify-center"
        >
          <Share2 className="w-4 h-4 text-[#B20605]" />
        </button>
        <button
          onClick={handlePrint}
          aria-label="Print"
          className="w-9 h-9 rounded-full bg-[#FFF5F5] flex items-center justify-center"
        >
          <Printer className="w-4 h-4 text-[#B20605]" />
        </button>
      </header>

      <div className="bg-white m-3 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-[#F6F3F3] overflow-hidden print:shadow-none print:m-0 print:border-0 print:rounded-none">
        {/* Header band */}
        <div className="bg-gradient-to-r from-[#1A0000] via-[#350000] to-[#C11717] text-white px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-80 flex items-center gap-1.5">
              {docLabel}
              <span className="bg-white/20 text-[9px] px-1.5 py-0.5 rounded font-bold">
                {hasCustomer ? "CUSTOMER" : "SALES"}
              </span>
            </div>
            <div className="text-[16px] font-bold mt-0.5">{order.orderNumber}</div>
          </div>
          <div className="bg-white/95 rounded-lg p-1.5">
            <img src={logo} alt="" className="h-8 w-auto object-contain" />
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] text-[#606060]">
              <div>Tanggal Issue</div>
              <div className="text-[#1A0000] font-semibold text-[13px] mt-0.5">
                {new Date(order.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
            <span className="bg-[#FFF0E6] text-[#E87B1E] px-3 py-1.5 rounded-full text-[11px] font-semibold">
              {order.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Block title={hasCustomer ? "Issued To" : "Sales (Issuer)"}>
              {hasCustomer ? (
                <>
                  <div className="font-semibold text-[#1A0000]">{buyer.customerName || "—"}</div>
                  {buyer.customerCode && (
                    <div className="text-[11px] text-[#606060]">Kode: {buyer.customerCode}</div>
                  )}
                  {buyer.phone && (
                    <div className="text-[11px] text-[#606060] mt-0.5">{buyer.phone}</div>
                  )}
                  {buyer.email && (
                    <div className="text-[11px] text-[#606060]">{buyer.email}</div>
                  )}
                  {buyer.address && (
                    <div className="text-[11px] text-[#606060] mt-1 leading-snug">
                      {buyer.address}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="font-semibold text-[#1A0000] flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#B20605]" />
                    {salesUser.fullName || salesUser.username || "—"}
                  </div>
                  {salesUser.username && (
                    <div className="text-[11px] text-[#606060]">@{salesUser.username}</div>
                  )}
                  {salesUser.phone && (
                    <div className="text-[11px] text-[#606060] mt-0.5">{salesUser.phone}</div>
                  )}
                  {salesUser.email && (
                    <div className="text-[11px] text-[#606060]">{salesUser.email}</div>
                  )}
                  <div className="text-[10px] text-[#B20605] mt-1 font-semibold uppercase tracking-wider">
                    Sales-placed Order
                  </div>
                </>
              )}
            </Block>

            <Block title="Cabang">
              <div className="font-semibold text-[#1A0000]">
                {hasCustomer ? buyer.branch || "—" : salesUser.branchName || "—"}
              </div>
              <div className="text-[11px] text-[#606060]">
                {hasCustomer ? buyer.regional || "" : salesUser.regionalName || ""}
              </div>
              {order.deliveryMethod && (
                <div className="text-[11px] text-[#606060] mt-1">
                  Pengiriman: {order.deliveryMethod}
                </div>
              )}
              {order.paymentMethod && (
                <div className="text-[11px] text-[#606060]">Pembayaran: {order.paymentMethod}</div>
              )}
            </Block>
          </div>

          {/* Items table (auto-group SN) */}
          <div className="border border-[#F6F3F3] rounded-xl overflow-hidden">
            <div className="bg-[#FFF5F5] px-3 py-2 grid grid-cols-[1fr_56px_90px] gap-2 text-[11px] font-bold text-[#1A0000] uppercase tracking-wider">
              <div>Produk</div>
              <div className="text-center">Qty</div>
              <div className="text-right">Subtotal</div>
            </div>
            <div className="divide-y divide-[#F6F3F3]">
              {groupOrderItems(order.items).map((g) => {
                if (!g.isGrouped) {
                  const it = g.rows[0];
                  const lineDiscount = Number(it.discount) || 0;
                  const hasPromo = lineDiscount > 0;
                  const unitNet = hasPromo && it.quantity ? it.unitPrice - lineDiscount / it.quantity : it.unitPrice;
                  // SN dari SOD (di-scan saat picking) — render kalau ada.
                  const serials = Array.isArray(it.serials) ? it.serials : [];
                  return (
                    <div
                      key={g.key}
                      className="px-3 py-2.5 grid grid-cols-[1fr_56px_90px] gap-2 text-[12px]"
                    >
                      <div>
                        <div className="text-[#1A0000] font-medium leading-tight">
                          {it.productName}
                        </div>
                        {it.productCode && (
                          <div className="text-[10px] text-[#606060] font-mono mt-0.5">
                            {it.productCode}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {hasPromo ? (
                            <>
                              <span className="line-through">@ {rupiah(it.unitPrice)}</span>{" "}
                              <span className="text-[#B20605]">@ {rupiah(unitNet)}</span>
                            </>
                          ) : (
                            <>@ {rupiah(it.unitPrice)}</>
                          )}
                        </div>
                        {hasPromo && (
                          <div className="mt-1 inline-flex bg-green-50 text-green-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border border-green-200">
                            🎁 Hemat {rupiah(lineDiscount)}
                          </div>
                        )}
                      </div>
                      <div className="text-center text-[#1A0000] self-center">{it.quantity}</div>
                      <div className="text-right text-[#1A0000] font-semibold self-center">
                        {rupiah(it.subtotal)}
                      </div>
                      {/* SN section — list SN voucher/kartu perdana yg sudah
                          di-scan gudang. Tampil di bawah row produk. */}
                      {serials.length > 0 && (
                        <div className="col-span-3 mt-2 ml-1 pl-3 border-l-2 border-[#FECECE] space-y-1">
                          {serials.map((sn, idx) => (
                            <div key={`${it.id}-${idx}`} className="flex items-center gap-1.5 text-[11px]">
                              <Hash className="w-2.5 h-2.5 text-[#B20605] shrink-0" />
                              <span className="font-mono text-[#1A0000] truncate">{sn}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={g.key} className="px-3 py-2.5">
                    <div className="grid grid-cols-[1fr_56px_90px] gap-2 text-[12px]">
                      <div>
                        <div className="text-[#1A0000] font-medium leading-tight">
                          {g.productName}
                        </div>
                        <div className="text-[10px] text-[#606060] mt-0.5">
                          <span className="bg-[#FFF5F5] text-[#B20605] px-1.5 py-0.5 rounded font-semibold mr-1">
                            {g.rows.length} nomor
                          </span>
                          @ {rupiah(g.unitPrice)}
                        </div>
                        {g.totalDiscount > 0 && (
                          <div className="mt-1 inline-flex bg-green-50 text-green-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border border-green-200">
                            🎁 Hemat {rupiah(g.totalDiscount)}
                          </div>
                        )}
                      </div>
                      <div className="text-center text-[#1A0000] self-center">
                        {g.totalQuantity}
                      </div>
                      <div className="text-right text-[#1A0000] font-semibold self-center">
                        {rupiah(g.totalSubtotal)}
                      </div>
                    </div>
                    <div className="mt-2 ml-1 pl-3 border-l-2 border-[#FECECE] space-y-1">
                      {g.rows.map((r, idx) => (
                        <div
                          key={r.id ?? `${g.key}-${idx}`}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Hash className="w-2.5 h-2.5 text-[#B20605] shrink-0" />
                            <span className="font-mono text-[#1A0000] truncate">
                              {r.productCode || "—"}
                            </span>
                          </div>
                          <span className="text-[#606060] shrink-0">{rupiah(r.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 space-y-1.5 text-[12px]">
            {(() => {
              const promoTotal = (order.items || []).reduce(
                (s, i) => s + (Number(i.discount) || 0), 0
              );
              const baseSubtotal = (order.items || []).reduce(
                (s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0
              );
              return (
                <>
                  <MoneyRow label="Subtotal Barang" value={baseSubtotal} />
                  {promoTotal > 0 && (
                    <MoneyRow label="Diskon Promo Produk" value={-Math.abs(promoTotal)} />
                  )}
                  {Math.abs(order.discount || 0) > 0 && (
                    <MoneyRow label="Diskon Voucher" value={-Math.abs(order.discount)} />
                  )}
                </>
              );
            })()}
            {Number(order.orderTaxAmount) > 0 && (
              <MoneyRow
                label={`Order Tax (${Number(order.orderTax || 0).toString()}%)`}
                value={Number(order.orderTaxAmount) || 0}
              />
            )}
            <MoneyRow label="Biaya Pengiriman" value={order.deliveryFee} />
            <MoneyRow label="Biaya Admin" value={order.adminFee} />
            <div className="border-t border-dashed border-gray-300 pt-2 mt-2 flex justify-between font-bold text-[15px]">
              <span className="text-[#1A0000]">TOTAL PEMBAYARAN</span>
              <span className="text-[#B20605]">{rupiah(order.total)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 bg-[#FBF9F9] border border-[#F6F3F3] rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#606060] mb-1">
                Catatan
              </div>
              <div className="text-[12px] text-[#1A0000] whitespace-pre-wrap">{order.notes}</div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-dashed border-gray-200 text-center text-[11px] text-[#606060] leading-relaxed">
            {isFinalInvoice ? (
              <>Dokumen ini adalah{" "}
                <span className="font-semibold text-[#1A0000]">invoice resmi</span> setelah pesanan disetujui Admin SO. Terima kasih.</>
            ) : (
              <>Dokumen ini adalah{" "}
                <span className="font-semibold text-[#1A0000]">proforma invoice</span> dan bukan bukti pembayaran resmi. Terima kasih.</>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 z-40 print:hidden">
        <button
          onClick={handleShare}
          className="flex-1 border border-[#B20605] text-[#B20605] font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Bagikan
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div className="bg-[#FBF9F9] border border-[#F6F3F3] rounded-xl p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-[#606060] mb-1">{title}</div>
      <div className="text-[12px] leading-tight">{children}</div>
    </div>
  );
}

function MoneyRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#606060]">{label}</span>
      <span className={value < 0 ? "text-green-600" : "text-[#1A0000]"}>
        {value < 0 ? "- " : ""}
        {rupiah(Math.abs(value || 0))}
      </span>
    </div>
  );
}
