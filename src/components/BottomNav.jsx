import { useLocation, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  ArrowLeftRight,
  Scan,
  FileText,
  User,
} from "lucide-react";

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 flex justify-between items-end px-6 pb-6 pt-3 z-50">
      <NavItem
        onClick={() => navigate("/")}
        icon={<HomeIcon className="w-6 h-6" fill="currentColor" />}
        label="Beranda"
        active={isActive("/") && pathname === "/"}
      />
      <NavItem
        onClick={() => navigate("/orders")}
        icon={<ArrowLeftRight className="w-6 h-6" />}
        label="Transaksi"
        active={isActive("/orders")}
      />

      {/* Center floating button */}
      <button
        onClick={() => navigate("/catalog")}
        className="relative flex flex-col items-center justify-end -mt-10 mb-1"
      >
        <div className="absolute -top-12 w-[60px] h-[60px] bg-[#C11717] rounded-full flex items-center justify-center shadow-lg shadow-red-900/20 border-[4px] border-[#FAFAFA]">
          <Scan className="w-7 h-7 text-white" />
        </div>
        <span className="text-[10px] font-medium text-gray-400 mt-2">Penjualan</span>
      </button>

      <NavItem
        onClick={() => navigate("/orders")}
        icon={<FileText className="w-6 h-6" />}
        label="Laporan"
      />
      <NavItem
        onClick={() => navigate("/profile")}
        icon={<User className="w-6 h-6" />}
        label="Profil"
        active={isActive("/profile")}
      />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <div className={active ? "text-[#C11717]" : "text-gray-400"}>{icon}</div>
      <span
        className={`text-[10px] font-medium ${
          active ? "text-[#C11717]" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
