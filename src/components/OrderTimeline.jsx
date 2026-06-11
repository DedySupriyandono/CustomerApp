import { useEffect, useState } from "react";
import { Check, Clock, ShoppingBag, UserCheck, ClipboardCheck, Package, Truck } from "lucide-react";

// Reusable timeline yg ambil dari /customer/orders/{id}/timeline atau
// /sales/orders/{id}/timeline tergantung api client yg di-pass.
//
// Props:
//   - orderId
//   - apiClient: instance api (customer api / sales api)
//   - urlPrefix: '/customer' atau '/sales'
//   - className: optional extra wrapper class
export default function OrderTimeline({ orderId, apiClient, urlPrefix = "/customer", className = "" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    apiClient.get(`${urlPrefix}/orders/${orderId}/timeline`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orderId, urlPrefix, apiClient]);

  if (loading) return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
      <div className="text-center text-gray-400 text-sm py-4">Memuat riwayat...</div>
    </div>
  );
  if (!data?.events?.length) return null;

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3] ${className}`}>
      <h3 className="font-bold text-[14px] text-[#1A0000] mb-3">Riwayat Pesanan</h3>
      <ol className="relative">
        {data.events.map((ev, idx) => {
          const isLast = idx === data.events.length - 1;
          return (
            <TimelineRow key={idx} event={ev} isLast={isLast} />
          );
        })}
      </ol>
    </div>
  );
}

function TimelineRow({ event, isLast }) {
  const Icon = iconFor(event.type);
  const dotColor = event.done ? "bg-[#B20605] text-white" : "bg-gray-200 text-gray-400";
  const lineColor = event.done ? "bg-[#B20605]" : "bg-gray-200";
  const ts = event.ts ? new Date(event.ts) : null;

  return (
    <li className="flex gap-3 pb-4 relative">
      {/* Vertical line (kecuali yg terakhir) */}
      {!isLast && (
        <span className={`absolute top-7 left-3 w-0.5 h-[calc(100%-12px)] ${lineColor}`} />
      )}
      {/* Dot icon */}
      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${dotColor}`}>
        {event.done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className={`text-[13px] font-semibold ${event.done ? "text-[#1A0000]" : "text-gray-400"}`}>
          {event.title}
        </div>
        {event.subtitle && (
          <div className={`text-[11px] mt-0.5 ${event.done ? "text-[#606060]" : "text-gray-400"}`}>
            {event.subtitle}
          </div>
        )}
        {ts && (
          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {ts.toLocaleString("id-ID", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit"
            })}
          </div>
        )}
      </div>
    </li>
  );
}

function iconFor(type) {
  switch (type) {
    case "order_placed": return ShoppingBag;
    case "sales_approved": return UserCheck;
    case "admin_processed": return ClipboardCheck;
    case "picked": return Package;
    case "delivered": return Truck;
    default: return Clock;
  }
}
