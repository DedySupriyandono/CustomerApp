import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ShoppingCart,
  ChevronRight,
  Flame,
  BookOpen,
  Receipt,
  Home as HomeIcon,
  Wifi,
} from "lucide-react";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useCustomerNotifications } from "../contexts/NotificationContext";
import BottomNav from "../components/BottomNav";
import { rupiah } from "../utils/format";
import bannerImg from "../assets/banner.png";
import bagImg from "../assets/bag-mascot.png";

export default function Home() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { unread } = useCustomerNotifications();
  const navigate = useNavigate();
  const [latestOrder, setLatestOrder] = useState(null);

  useEffect(() => {
    api
      .get("/customer/orders", { params: { page: 1, pageSize: 1 } })
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data?.data || [];
        setLatestOrder(list[0] || null);
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="mobile-container relative shadow-2xl"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="pb-28">
        {/* Header background */}
        <div className="absolute top-0 left-0 right-0 h-[220px] bg-gradient-to-b from-[#540101] to-[#2A0000] rounded-b-3xl z-0" />

        <div className="relative z-10">
          {/* Header */}
          <header className="px-5 pt-12 pb-6 flex justify-between items-start">
            <div>
              <p className="text-[#dedede] text-sm mb-0.5 font-medium">Selamat datang,</p>
              <h1 className="text-white text-xl font-bold">{user?.customerName || "Customer"}</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/notifications")}
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
                onClick={() => navigate("/checkout")}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5 relative"
                aria-label="Keranjang"
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

          {/* Top Menu */}
          <div className="bg-white rounded-3xl px-5 py-6 mx-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex justify-between items-center -mt-2">
            <MenuItem
              onClick={() => navigate("/catalog")}
              icon={<BookOpen className="w-7 h-7 text-[#B20605]" fill="#FECECE" />}
              label="Katalog"
            />
            <MenuItem
              onClick={() => navigate("/order")}
              icon={<ShoppingCart className="w-7 h-7 text-[#B20605]" fill="#FECECE" />}
              label="Order"
            />
            <MenuItem
              onClick={() => navigate("/orders")}
              icon={<Receipt className="w-7 h-7 text-[#B20605]" fill="#FECECE" />}
              label="Penjualan"
            />
            <MenuItem
              onClick={() => navigate("/services")}
              icon={
                <div className="relative">
                  <HomeIcon className="w-7 h-7 text-[#B20605]" fill="#FECECE" />
                  <div className="absolute -bottom-1 -right-2 bg-white rounded-full p-0.5">
                    <Wifi className="w-3.5 h-3.5 text-[#B20605]" />
                  </div>
                </div>
              }
              label="Jasa"
            />
          </div>

          {/* Banner */}
          <div className="mt-5 px-5">
            <div className="relative rounded-xl overflow-hidden aspect-[358/146] shadow-sm">
              <img src={bannerImg} alt="Banner" className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              <div className="w-4 h-1.5 rounded-full bg-[#B20605]" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </div>
          </div>

          {/* Flash Sale */}
          <div className="mt-4 mx-5 bg-gradient-to-br from-[#410000] to-[#220000] rounded-[20px] p-4 relative overflow-hidden shadow-lg">
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#FF9D00] fill-[#FF9D00]" />
                <h2 className="text-white font-bold text-base">Flash Sale</h2>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </div>

            <div className="absolute -left-6 top-16 w-32 h-32 z-0">
              <img src={bagImg} alt="Bag Mascot" className="w-full h-full object-contain" />
            </div>

            <div className="flex gap-3 overflow-x-auto scrollbar-hide relative z-10 pl-[85px] pb-2">
              <FlashSaleCard />
              <FlashSaleCard />
            </div>
          </div>

          {/* Orderan Saya */}
          <div className="mt-6 px-5 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[17px] text-[#1A0000]">Orderan Saya</h2>
              <button onClick={() => navigate("/orders")}>
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            </div>

            {latestOrder ? (
              <button
                onClick={() => navigate(`/success/${latestOrder.id}`)}
                className="w-full text-left bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-50"
              >
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 border-dashed mb-3">
                  <div>
                    <p className="font-bold text-[#1A0000] text-[15px]">{latestOrder.orderNumber}</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">
                      {new Date(latestOrder.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="bg-[#FFF0E6] text-[#E87B1E] px-3 py-1.5 rounded-full text-[11px] font-semibold">
                    {latestOrder.status}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Row label="Jumlah Produk" value={`${latestOrder.items.length} produk`} />
                  <Row
                    label="Total Item"
                    value={`${latestOrder.items.reduce((s, i) => s + i.quantity, 0)} pcs`}
                  />
                  <div className="flex justify-between items-center mt-1 pt-1">
                    <span className="text-gray-500 text-[13px]">Subtotal</span>
                    <span className="text-[#1A0000] font-bold text-[15px]">
                      {rupiah(latestOrder.total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-500 text-[13px]">Status Pembayaran</span>
                    <span
                      className={`font-semibold text-[13px] ${
                        latestOrder.paymentMethod === "COD"
                          ? "text-[#E87B1E]"
                          : "text-[#10B981]"
                      }`}
                    >
                      {latestOrder.paymentMethod === "COD" ? "Belum Bayar" : "Lunas"}
                    </span>
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-sm shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-50">
                Belum ada order
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
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

function FlashSaleCard() {
  return (
    <div className="bg-white rounded-[14px] p-3 w-[145px] shrink-0 shadow-sm relative pt-4">
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#B20605] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full z-10 border-2 border-[#410000]">
        -15%
      </div>
      <div className="mt-1">
        <h3 className="font-bold text-[#1A0000] text-[14px] leading-tight">Simpati</h3>
        <p className="text-gray-400 text-[11px] mt-0.5 mb-1.5">Kartu Perdana</p>
        <div className="flex flex-col gap-0.5">
          <span className="text-gray-400 line-through text-[11px]">Rp 35.000</span>
          <span className="text-[#E87B1E] font-bold text-[14px]">Rp 25.000</span>
        </div>
        <button className="w-full mt-3 bg-gradient-to-r from-[#C11717] to-[#990D0D] text-white py-2 rounded-full text-[11px] font-bold shadow-sm">
          Beli Sekarang
        </button>
      </div>
    </div>
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
