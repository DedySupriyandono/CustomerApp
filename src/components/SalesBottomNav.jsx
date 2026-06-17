import { useLocation, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  ClipboardCheck,
  ShoppingCart,
  ArrowLeftRight,
  User,
} from "lucide-react";

export default function SalesBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = (p) => (p === "/sales" ? pathname === "/sales" : pathname.startsWith(p));

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 flex justify-between items-end px-6 pb-6 pt-3 z-50">
      <Item onClick={() => navigate("/sales")} icon={<HomeIcon className="w-6 h-6" fill="currentColor" />} label="Beranda" active={active("/sales") && pathname === "/sales"} />
      <Item onClick={() => navigate("/sales/approval")} icon={<ClipboardCheck className="w-6 h-6" />} label="Approval" active={active("/sales/approval")} />
      <button onClick={() => navigate("/sales/order")} className="relative flex flex-col items-center justify-end -mt-10 mb-1">
        <div className="absolute -top-12 w-[60px] h-[60px] bg-[#C11717] rounded-full flex items-center justify-center shadow-lg shadow-red-900/20 border-[4px] border-[#FAFAFA]">
          <ShoppingCart className="w-7 h-7 text-white" />
        </div>
        <span className="text-[10px] font-medium text-gray-400 mt-2">Order</span>
      </button>
      <Item onClick={() => navigate("/sales/transactions")} icon={<ArrowLeftRight className="w-6 h-6" />} label="Transaksi" active={active("/sales/transactions")} />
      <Item onClick={() => navigate("/sales/profile")} icon={<User className="w-6 h-6" />} label="Profil" active={active("/sales/profile")} />
    </div>
  );
}

function Item({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <div className={active ? "text-[#C11717]" : "text-gray-400"}>{icon}</div>
      <span className={`text-[10px] font-medium ${active ? "text-[#C11717]" : "text-gray-400"}`}>{label}</span>
    </button>
  );
}
