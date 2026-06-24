import { useLocation, useNavigate } from "react-router-dom";
import { Home as HomeIcon, FileBarChart, User } from "lucide-react";

// Bottom-nav owner portal: 3 menu (Home / Report / Profile).
// Match mockup — single primary blue (#1E1B4B-ish), bukan merah seperti sales.
export default function OwnerBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = (p) =>
    p === "/owner" ? pathname === "/owner" : pathname.startsWith(p);

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 flex justify-around items-end px-6 pb-6 pt-3 z-50">
      <Item
        onClick={() => navigate("/owner")}
        icon={<HomeIcon className="w-6 h-6" fill={isActive("/owner") && pathname === "/owner" ? "currentColor" : "none"} />}
        label="Home"
        active={isActive("/owner") && pathname === "/owner"}
      />
      <Item
        onClick={() => navigate("/owner/reports")}
        icon={<FileBarChart className="w-6 h-6" />}
        label="Report"
        active={isActive("/owner/reports")}
      />
      <Item
        onClick={() => navigate("/owner/profile")}
        icon={<User className="w-6 h-6" />}
        label="Profile"
        active={isActive("/owner/profile")}
      />
    </div>
  );
}

function Item({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <div className={active ? "text-[#B20605]" : "text-gray-400"}>{icon}</div>
      <span className={`text-[12px] font-semibold ${active ? "text-[#B20605]" : "text-gray-400"}`}>
        {label}
      </span>
    </button>
  );
}
