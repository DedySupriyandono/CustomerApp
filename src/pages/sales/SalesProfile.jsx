import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bell, ShoppingCart, Phone, Mail, MapPin, Building2,
  User as UserIcon, LogOut, ChevronRight, Briefcase, KeyRound,
} from "lucide-react";
import salesApi from "../../api/salesApi";
import { useSalesAuth } from "../../contexts/SalesAuthContext";
import { useSalesCart } from "../../contexts/SalesCartContext";
import SalesBottomNav from "../../components/SalesBottomNav";
import BottomSheet from "../../components/BottomSheet";

export default function SalesProfile() {
  const { sales, logout } = useSalesAuth();
  const { totalItems } = useSalesCart();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    salesApi
      .get("/sales/me")
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  const user = data || sales || {};
  const initial = (user.fullName || user.userName || "S")[0]?.toUpperCase();

  return (
    <div
      className="mobile-container relative shadow-2xl pb-28"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[220px] bg-gradient-to-b from-[#1A0000] via-[#350000] to-[#540101] z-0" />

      <div className="relative z-10">
        <header className="flex items-center justify-between px-5 pt-12 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-base font-bold">Profil Sales</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/sales/notifications")}
              aria-label="Notifikasi"
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>
            <button
              onClick={() => navigate("/sales/checkout")}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative"
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

        <div className="px-5">
          <div className="bg-white rounded-2xl p-5 shadow-[0_2px_15px_rgba(0,0,0,0.06)] border border-[#F6F3F3] flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B20605] to-[#540101] text-white flex items-center justify-center text-2xl font-bold shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                initial
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[#1A0000] text-[16px] truncate">{user.fullName || user.userName || "—"}</div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">@{user.userName}</div>
              <div className="inline-flex items-center gap-1 mt-1 bg-[#FFF5F5] text-[#B20605] text-[10px] px-2 py-0.5 rounded-full font-semibold">
                <Briefcase className="w-3 h-3" /> {user.role || "SALES"}
              </div>
            </div>
          </div>
        </div>

        <section className="bg-[#FBF9F9] rounded-t-[20px] mt-5 min-h-[calc(100vh-260px)] px-5 pt-5">
          {loading && <div className="text-center text-gray-400 py-8 text-sm">Memuat...</div>}
          {!loading && error && <div className="text-center text-red-600 py-6 text-sm">{error}</div>}

          {!loading && (
            <>
              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] overflow-hidden">
                <SectionTitle>Kontak</SectionTitle>
                <InfoRow icon={<Phone className="w-4 h-4" />} label="No. HP" value={user.phone} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
                <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Username" value={user.userName} />
              </div>

              <div className="bg-white rounded-2xl mt-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] overflow-hidden">
                <SectionTitle>Cabang</SectionTitle>
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Branch" value={user.branchName} />
                <InfoRow label="Regional" value={user.regionalName} />
                <InfoRow label="Warehouse" value={user.warehouseName} />
              </div>

              {user.address && (
                <div className="bg-white rounded-2xl mt-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] overflow-hidden">
                  <SectionTitle>Alamat</SectionTitle>
                  <InfoRow icon={<MapPin className="w-4 h-4" />} label="Alamat" value={user.address} />
                </div>
              )}

              <button
                onClick={() => setPwOpen(true)}
                className="w-full mt-4 bg-white border border-[#F6F3F3] rounded-2xl px-4 py-4 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FFF5F5] text-[#B20605] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left font-semibold text-[14px] text-[#1A0000]">
                  Ubah Password
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate("/sales/login", { replace: true });
                }}
                className="w-full mt-3 bg-white border border-[#B20605] text-[#B20605] font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Keluar
              </button>

              <div className="text-center text-[11px] text-gray-400 mt-4">MDPOS Sales · v1.0</div>
            </>
          )}
        </section>
      </div>

      <SalesBottomNav />

      <BottomSheet open={pwOpen} onClose={() => setPwOpen(false)} title="Ubah Password">
        <PasswordForm onDone={() => setPwOpen(false)} />
      </BottomSheet>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="px-4 pt-4 pb-2 text-[11px] font-bold text-[#606060] uppercase tracking-wider">
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  const display = value && String(value).trim() !== "" ? value : "—";
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-t border-[#F6F3F3]">
      <div className="w-7 h-7 rounded-lg bg-[#FFF5F5] text-[#B20605] flex items-center justify-center shrink-0">
        {icon || <ChevronRight className="w-4 h-4 opacity-0" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-gray-500">{label}</div>
        <div className="text-[13px] text-[#1A0000] font-medium break-words">{display}</div>
      </div>
    </div>
  );
}

function PasswordForm({ onDone }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const save = async () => {
    setErr("");
    setOk("");
    if (next.length < 4) return setErr("Password baru minimal 4 karakter");
    if (next !== confirm) return setErr("Konfirmasi password tidak cocok");

    setLoading(true);
    try {
      await salesApi.post("/sales/me/password", {
        currentPassword: current,
        newPassword: next,
      });
      setOk("Password berhasil diubah");
      setTimeout(onDone, 800);
    } catch (e) {
      setErr(e.response?.data?.message || e.message || "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Field label="Password Lama" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <Field label="Password Baru" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      <Field label="Konfirmasi Password Baru" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

      {err && <div className="text-red-600 text-xs mb-2">{err}</div>}
      {ok && <div className="text-green-600 text-xs mb-2">{ok}</div>}

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 py-3 rounded-xl border border-[#F6F3F3] text-[#606060] font-semibold"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-semibold disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Ubah Password"}
        </button>
      </div>
    </>
  );
}

function Field({ label, ...rest }) {
  return (
    <div className="mb-3">
      <label className="block text-[12px] font-medium text-[#1A0000] mb-1">{label}</label>
      <input
        {...rest}
        className="w-full border border-[#F6F3F3] bg-white rounded-xl px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#B20605]"
      />
    </div>
  );
}
