import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import api from "../api/api";
import logo from "../assets/belanja-yuk.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: verify, 2: new password, 3: success

  // Step 1 state
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Step 2 state
  const [resetToken, setResetToken] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.post("/customer/forgot-password/verify", { phone, email });
      setResetToken(data.resetToken);
      setCustomerName(data.customerName || "");
      setStep(2);
    } catch (e) {
      setErr(e.response?.data?.message || e.message || "Verifikasi gagal");
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setErr("");
    if (newPw.length < 4) {
      setErr("Password baru minimal 4 karakter");
      return;
    }
    if (newPw !== confirmPw) {
      setErr("Konfirmasi password tidak cocok");
      return;
    }
    setLoading(true);
    try {
      await api.post("/customer/forgot-password/reset", { resetToken, newPassword: newPw });
      setStep(3);
    } catch (e) {
      setErr(e.response?.data?.message || e.message || "Reset gagal");
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
      <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#FE9F9F]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-32 -right-20 w-80 h-80 rounded-full bg-[#FFD7A8]/15 blur-3xl pointer-events-none" />

      <header className="relative z-10 flex items-center gap-3 px-5 pt-10 pb-2">
        <button
          onClick={() => (step === 2 ? setStep(1) : navigate(-1))}
          aria-label="Kembali"
          className="w-10 h-10 rounded-full bg-white/15 backdrop-blur border border-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white text-base font-bold">Lupa Password</h1>
      </header>

      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-4 pb-2">
        <div className="bg-white/95 rounded-[24px] shadow-2xl px-5 py-4 max-w-[220px] w-full">
          <img src={logo} alt="belanja yuk" className="w-full h-auto object-contain" />
        </div>
      </div>

      <div className="relative z-10 flex-1 bg-white rounded-t-[28px] mt-6 px-6 pt-7 pb-10 shadow-[0_-10px_30px_rgba(0,0,0,0.15)]">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          <StepDot active={step >= 1} done={step > 1} label="Verifikasi" />
          <div className={`flex-1 h-0.5 ${step > 1 ? "bg-[#B20605]" : "bg-gray-200"}`} />
          <StepDot active={step >= 2} done={step > 2} label="Password Baru" />
        </div>

        {step === 1 && (
          <form onSubmit={verify}>
            <h2 className="text-[20px] font-bold text-[#1A0000]">Verifikasi Akun</h2>
            <p className="text-[#606060] text-sm mt-1 mb-5">
              Masukkan nomor HP & email yang terdaftar untuk reset password.
            </p>

            <Label>Nomor HP</Label>
            <IconInput
              icon={<Phone className="w-4 h-4 text-[#B20605]" />}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              required
            />

            <Label className="mt-4">Email</Label>
            <IconInput
              icon={<Mail className="w-4 h-4 text-[#B20605]" />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
            />

            {err && <ErrorBox>{err}</ErrorBox>}

            <PrimaryButton loading={loading}>Verifikasi</PrimaryButton>

            <p className="text-center text-[13px] text-[#606060] mt-5">
              Ingat password?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-[#B20605] font-bold"
              >
                Masuk
              </button>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={reset}>
            <h2 className="text-[20px] font-bold text-[#1A0000]">Set Password Baru</h2>
            <p className="text-[#606060] text-sm mt-1 mb-5">
              {customerName ? `Halo, ${customerName}. ` : ""}Buat password baru untuk akun Anda.
            </p>

            <Label>Password Baru</Label>
            <IconInput
              icon={<Lock className="w-4 h-4 text-[#B20605]" />}
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Minimal 4 karakter"
              required
              right={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-[#606060]"
                  aria-label="Toggle"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Label className="mt-4">Konfirmasi Password Baru</Label>
            <IconInput
              icon={<Lock className="w-4 h-4 text-[#B20605]" />}
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Ulangi password baru"
              required
            />

            {err && <ErrorBox>{err}</ErrorBox>}

            <PrimaryButton loading={loading}>Reset Password</PrimaryButton>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-[20px] font-bold text-[#1A0000]">Password Berhasil Direset</h2>
            <p className="text-[#606060] text-sm mt-2 mb-6">
              Silakan masuk dengan password baru Anda.
            </p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/20"
            >
              Masuk Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepDot({ active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
          done
            ? "bg-[#B20605] text-white"
            : active
            ? "bg-[#FFF5F5] text-[#B20605] border-2 border-[#B20605]"
            : "bg-gray-100 text-gray-400 border-2 border-gray-200"
        }`}
      >
        {done ? "✓" : label === "Verifikasi" ? "1" : "2"}
      </div>
      <span
        className={`text-[10px] ${
          active || done ? "text-[#1A0000] font-semibold" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function Label({ children, className = "" }) {
  return (
    <label className={`block text-[12px] font-semibold text-[#1A0000] mb-1.5 ${className}`}>
      {children}
    </label>
  );
}

function IconInput({ icon, right, ...props }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
      <input
        {...props}
        className="w-full border border-[#F6F3F3] bg-[#FBF9F9] rounded-xl pl-10 pr-11 py-3 text-[14px] focus:outline-none focus:border-[#B20605] focus:bg-white"
      />
      {right && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
      )}
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-xl px-3 py-2 mt-3">
      {children}
    </div>
  );
}

function PrimaryButton({ children, loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full mt-5 bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/20 disabled:opacity-60"
    >
      {loading ? "Memproses..." : children}
    </button>
  );
}
