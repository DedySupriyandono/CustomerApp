import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ShoppingCart,
  ChevronRight,
  Flame,
  ClipboardCheck,
  ShoppingBag,
  Receipt,
  User as UserIcon,
} from "lucide-react";
import salesApi from "../../api/salesApi";
import { useSalesAuth } from "../../contexts/SalesAuthContext";
import { useSalesCart } from "../../contexts/SalesCartContext";
import { useSalesNotifications } from "../../contexts/NotificationContext";
import SalesBottomNav from "../../components/SalesBottomNav";
import { rupiah } from "../../utils/format";
import bannerImg from "../../assets/banner.png";
import bagImg from "../../assets/bag-mascot.png";

export default function SalesHome() {
  const { sales } = useSalesAuth();
  const { totalItems } = useSalesCart();
  const { unread } = useSalesNotifications();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [latestPlaced, setLatestPlaced] = useState(null);

  useEffect(() => {
    salesApi
      .get("/sales/orders", { params: { status: "Menunggu Konfirmasi", page: 1, pageSize: 1 } })
      .then((r) => setPendingCount(r.data?.totalRecords || 0))
      .catch(() => {});
    salesApi
      .get("/sales/orders/mine", { params: { page: 1, pageSize: 1 } })
      .then((r) => setLatestPlaced(r.data?.data?.[0] || null))
      .catch(() => {});
  }, []);

  return (
    <div
      className="mobile-container relative shadow-2xl"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="pb-28">
        <div className="absolute top-0 left-0 right-0 h-[220px] bg-gradient-to-b from-[#1A0000] via-[#350000] to-[#540101] rounded-b-3xl z-0" />

        <div className="relative z-10">
          <header className="px-5 pt-12 pb-6 flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[10px] font-semibold px-2 py-1 rounded-full backdrop-blur mb-2">
                SALES
              </div>
              <p className="text-[#dedede] text-sm mb-0.5 font-medium">Halo,</p>
              <h1 className="text-white text-xl font-bold">{sales?.fullName || sales?.username}</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/sales/notifications")}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative backdrop-blur-sm border border-white/5"
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5 text-white" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#B20605] text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold border border-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/sales/checkout")}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5 relative"
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

          {/* Top menu */}
          <div className="bg-white rounded-3xl px-5 py-6 mx-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex justify-between items-center -mt-2">
            <MenuItem
              onClick={() => navigate("/sales/order")}
              icon={<ShoppingBag className="w-7 h-7 text-[#B20605]" fill="#FECECE" />}
              label="Order"
            />
            <MenuItem
              onClick={() => navigate("/sales/approval")}
              icon={
                <div className="relative">
                  <ClipboardCheck className="w-7 h-7 text-[#B20605]" fill="#FECECE" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#B20605] text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                      {pendingCount}
                    </span>
                  )}
                </div>
              }
              label="Approval"
            />
            <MenuItem
              onClick={() => navigate("/sales/transactions")}
              icon={<Receipt className="w-7 h-7 text-[#B20605]" fill="#FECECE" />}
              label="Transaksi"
            />
            <MenuItem
              onClick={() => navigate("/sales/profile")}
              icon={<UserIcon className="w-7 h-7 text-[#B20605]" fill="#FECECE" />}
              label="Profil"
            />
          </div>

          {/* Banner */}
          <div className="mt-5 px-5">
            <div className="relative rounded-xl overflow-hidden aspect-[358/146] shadow-sm">
              <img src={bannerImg} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              <div className="w-4 h-1.5 rounded-full bg-[#B20605]" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </div>
          </div>

          {/* Pending approvals call-out */}
          {pendingCount > 0 && (
            <button
              onClick={() => navigate("/sales/approval")}
              className="mt-4 mx-5 w-[calc(100%-2.5rem)] bg-gradient-to-br from-[#410000] to-[#220000] rounded-[20px] p-4 relative overflow-hidden shadow-lg block text-left"
            >
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#FF9D00] fill-[#FF9D00]" />
                  <h2 className="text-white font-bold text-base">
                    {pendingCount} Pesanan Menunggu Approval
                  </h2>
                </div>
                <ChevronRight className="w-5 h-5 text-white/80" />
              </div>
              <div className="absolute -left-6 top-4 w-32 h-32 opacity-30 z-0">
                <img src={bagImg} alt="" className="w-full h-full object-contain" />
              </div>
              <p className="text-white/80 text-xs mt-2 relative z-10">
                Tinjau dan approve pesanan customer
              </p>
            </button>
          )}

          {/* Latest sales-placed order */}
          <div className="mt-6 px-5 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[17px] text-[#1A0000]">Order Saya Terakhir</h2>
              <button onClick={() => navigate("/sales/transactions")}>
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            </div>
            {latestPlaced ? (
              <button
                onClick={() => navigate(`/sales/transactions/${latestPlaced.id}`)}
                className="w-full text-left bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-50"
              >
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 border-dashed mb-3">
                  <div>
                    <p className="font-bold text-[#1A0000] text-[15px]">
                      {latestPlaced.orderNumber}
                    </p>
                    <p className="text-gray-400 text-[11px] mt-0.5">
                      {new Date(latestPlaced.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="bg-[#FFF0E6] text-[#E87B1E] px-3 py-1.5 rounded-full text-[11px] font-semibold">
                    {latestPlaced.status}
                  </div>
                </div>
                <div className="space-y-2 text-[13px]">
                  <Row label="Produk" value={`${latestPlaced.itemCount} item`} />
                  <Row label="Total Qty" value={`${latestPlaced.totalQuantity} pcs`} />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-500">Total</span>
                    <span className="text-[#B20605] font-bold text-[15px]">
                      {rupiah(latestPlaced.total)}
                    </span>
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-sm shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-50">
                Belum ada order. Klik "Order" untuk mulai.
              </div>
            )}
          </div>
        </div>
      </div>

      <SalesBottomNav />
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <div className="w-[62px] h-[62px] bg-[#FFF5F5] rounded-[18px] flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[12px] font-semibold text-[#1A0000]">{label}</span>
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-[13px]">{label}</span>
      <span className="text-[#1A0000] font-semibold text-[13px]">{value}</span>
    </div>
  );
}
