import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, Lock, Eye, EyeOff, Crown } from "lucide-react";
import { useOwnerAuth } from "../../contexts/OwnerAuthContext";
import logo from "../../assets/belanja-yuk.png";

export default function OwnerLogin() {
  const { login } = useOwnerAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/owner", { replace: true });
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
        background: "linear-gradient(180deg, #1A0000 0%, #350000 45%, #540101 100%)",
      }}
    >
      <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#FE9F9F]/10 blur-3xl pointer-events-none" />
      <div className="absolute top-32 -right-20 w-80 h-80 rounded-full bg-[#FFD7A8]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-14 pb-4">
        <div className="bg-white/95 rounded-[24px] shadow-2xl px-5 py-4 max-w-[240px] w-full">
          <img src={logo} alt="belanja yuk" className="w-full h-auto object-contain" />
        </div>
        <div className="inline-flex items-center gap-1.5 mt-4 bg-white/15 text-white text-[12px] font-semibold px-3 py-1 rounded-full backdrop-blur">
          <Crown className="w-3.5 h-3.5" /> OWNER PORTAL
        </div>
        <p className="text-white/90 text-sm mt-3 text-center max-w-[260px]">
          Pantau bisnis Anda secara menyeluruh
        </p>
      </div>

      <form
        onSubmit={submit}
        className="relative z-10 bg-white rounded-t-[28px] px-6 pt-7 pb-10 shadow-[0_-10px_30px_rgba(0,0,0,0.15)]"
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="text-[20px] font-bold text-[#1A0000]">Login Owner</h2>
        <p className="text-[#606060] text-sm mt-1 mb-6">Masuk dengan akun owner Anda</p>

        <label className="block text-[12px] font-semibold text-[#1A0000] mb-1.5">
          Username / Email / HP
        </label>
        <div className="relative mb-4">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B20605]" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
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
            aria-label="Toggle"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-xl px-3 py-2 mt-3">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-5 bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/20 disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
