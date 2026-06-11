import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

export default function Header({ title, showBack, transparent }) {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  return (
    <div
      className={`sticky top-0 z-30 px-4 py-3 flex items-center gap-3 ${
        transparent
          ? "bg-gradient-to-b from-primary-dark to-primary text-white"
          : "bg-white border-b border-gray-200"
      }`}
    >
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            transparent ? "bg-white/20" : "bg-gray-100"
          }`}
        >
          ←
        </button>
      )}
      <h1 className="flex-1 text-lg font-semibold truncate">{title}</h1>
      <button
        className={`w-9 h-9 rounded-full flex items-center justify-center ${
          transparent ? "bg-white/20" : "bg-gray-100"
        }`}
      >
        🔔
      </button>
      <button
        onClick={() => navigate("/checkout")}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center ${
          transparent ? "bg-white/20" : "bg-gray-100"
        }`}
      >
        🛒
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>
    </div>
  );
}
