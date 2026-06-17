import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/belanja-yuk.png";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("81277773187");
  const [password, setPassword] = useState("P@ssw0rd");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(phone, password);
      navigate("/", { replace: true });
    } catch (e) {
      setErr(e.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mobile-container relative min-h-screen flex flex-col overflow-hidden"
      style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        background: "linear-gradient(180deg, #540101 0%, #8A0114 45%, #C11717 100%)",
      }}
    >
      {/* Soft glow blobs */}
      <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#FE9F9F]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-32 -right-20 w-80 h-80 rounded-full bg-[#FFD7A8]/15 blur-3xl pointer-events-none" />

      {/* Logo block */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-4">
        <div className="bg-white/95 rounded-[28px] shadow-2xl px-6 py-5 max-w-[300px] w-full flex items-center justify-center">
          <img
            src={logo}
            alt="belanja yuk"
            className="w-full h-auto object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.15)]"
          />
        </div>
        <p className="text-white/90 text-sm mt-5 text-center max-w-[280px]">
          Belanja mudah, antar cepat, harga teman 🎉
        </p>
      </div>

      {/* Form sheet */}
      <form
        onSubmit={submit}
        className="relative z-10 bg-white rounded-t-[28px] px-6 pt-7 pb-10 shadow-[0_-10px_30px_rgba(0,0,0,0.15)]"
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

        <h2 className="text-[20px] font-bold text-[#1A0000]">Selamat Datang 👋</h2>
        <p className="text-[#606060] text-sm mt-1 mb-6">Masuk untuk mulai belanja</p>

        <label className="block text-[12px] font-semibold text-[#1A0000] mb-1.5">Nomor HP</label>
        <div className="relative mb-4">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B20605]" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            required
            className="w-full border border-[#F6F3F3] bg-[#FBF9F9] rounded-xl pl-10 pr-3 py-3 text-[14px] focus:outline-none focus:border-[#B20605] focus:bg-white"
          />
        </div>

        <label className="block text-[12px] font-semibold text-[#1A0000] mb-1.5">Password</label>
        <div className="relative mb-2">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B20605]" />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full border border-[#F6F3F3] bg-[#FBF9F9] rounded-xl pl-10 pr-11 py-3 text-[14px] focus:outline-none focus:border-[#B20605] focus:bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606060]"
            aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-[12px] text-[#B20605] font-semibold"
          >
            Lupa password?
          </button>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-xl px-3 py-2 mb-3">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/20 disabled:opacity-60 mt-1"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
