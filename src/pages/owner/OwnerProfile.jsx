import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle, BookOpen, Lock, LogOut, ChevronRight, Eye, EyeOff, X,
  Phone, Mail, User as UserIcon, Pencil,
} from "lucide-react";
import Swal from "sweetalert2";
import { ownerApi, useOwnerAuth } from "../../contexts/OwnerAuthContext";
import OwnerBottomNav from "../../components/OwnerBottomNav";

function initials(name) {
  if (!name) return "OW";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export default function OwnerProfile() {
  const navigate = useNavigate();
  const { owner, logout } = useOwnerAuth();
  const [showPwModal, setShowPwModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contact, setContact] = useState({
    username: owner?.username || "",
    email:    owner?.email    || "",
    phone:    owner?.phone    || "",
  });

  // Fetch data terbaru — localStorage bisa stale.
  const loadMe = async () => {
    try {
      const { data } = await ownerApi.get("/owner/me");
      setContact({
        username: data.username || "",
        email:    data.email    || "",
        phone:    data.phone    || "",
      });
      // Sync ke localStorage supaya konsisten di halaman lain.
      const raw = localStorage.getItem("ownerUser");
      if (raw) {
        const cur = JSON.parse(raw);
        localStorage.setItem("ownerUser", JSON.stringify({
          ...cur,
          username: data.username,
          email:    data.email,
          phone:    data.phone,
          fullName: data.fullName,
        }));
      }
    } catch (e) {
      if (e.response?.status === 401) navigate("/owner/login", { replace: true });
    }
  };
  useEffect(() => { loadMe(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doLogout = async () => {
    const r = await Swal.fire({
      title: "Logout?",
      text: "Keluar dari sesi owner.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Batal",
    });
    if (r.isConfirmed) {
      logout();
      navigate("/owner/login", { replace: true });
    }
  };

  return (
    <div
      className="mobile-container min-h-screen bg-[#F8F9FC] pb-28"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div
        className="flex flex-col items-center pt-10 pb-10 rounded-b-[24px]"
        style={{ background: "linear-gradient(180deg, #1A0000 0%, #540101 100%)" }}
      >
        <div className="relative">
          <div className="w-[120px] h-[120px] rounded-full bg-[linear-gradient(135deg,#FE9F9F,#B20605)] text-white flex items-center justify-center text-[34px] font-extrabold shadow-lg border-4 border-white">
            {initials(owner?.fullName || contact.username || owner?.username)}
          </div>
          <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
        </div>
        <h2 className="text-[20px] font-bold text-white mt-4">{owner?.fullName || contact.username || "Owner"}</h2>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {/* Kontak card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-bold text-gray-400 tracking-wider">KONTAK</h3>
            <button
              onClick={() => setShowContactModal(true)}
              aria-label="Edit kontak"
              className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100"
            >
              <Pencil className="w-4 h-4 text-[#B20605]" />
            </button>
          </div>

          <ContactRow icon={<Phone className="w-5 h-5 text-[#B20605]" />} label="No. HP"    value={contact.phone    || "-"} />
          <div className="border-t border-gray-100 my-2" />
          <ContactRow icon={<Mail  className="w-5 h-5 text-[#B20605]" />} label="Email"     value={contact.email    || "-"} />
          <div className="border-t border-gray-100 my-2" />
          <ContactRow icon={<UserIcon className="w-5 h-5 text-[#B20605]" />} label="Username" value={contact.username || "-"} />
        </div>

        <Row tint="bg-blue-50"  icon={<HelpCircle className="w-6 h-6 text-blue-600" />}  title="FAQ"
             desc="Frequently asked questions" onClick={() => Swal.fire({ icon: "info", title: "Coming soon", text: "Halaman FAQ sedang disiapkan." })} />
        <Row tint="bg-indigo-50" icon={<BookOpen className="w-6 h-6 text-indigo-600" />} title="Manual Book"
             desc="Comprehensive user guide (PDF)" onClick={() => navigate("/owner/manual")} />
        <Row tint="bg-orange-50" icon={<Lock className="w-6 h-6 text-orange-500" />}     title="Change Password"
             desc="Update your login password" onClick={() => setShowPwModal(true)} />
        <Row tint="bg-red-50" icon={<LogOut className="w-6 h-6 text-red-500" />} title={<span className="text-red-500">Logout</span>}
             desc="Safely logout from session" onClick={doLogout} />
      </div>

      {showPwModal && <ChangePwModal onClose={() => setShowPwModal(false)} />}
      {showContactModal && (
        <EditContactModal
          initial={contact}
          onClose={() => setShowContactModal(false)}
          onSaved={(data) => {
            setContact({
              username: data.username || "",
              email:    data.email    || "",
              phone:    data.phone    || "",
            });
            const raw = localStorage.getItem("ownerUser");
            if (raw) {
              const cur = JSON.parse(raw);
              localStorage.setItem("ownerUser", JSON.stringify({
                ...cur,
                username: data.username,
                email:    data.email,
                phone:    data.phone,
              }));
            }
          }}
        />
      )}
      <OwnerBottomNav />
    </div>
  );
}

function ContactRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-[14px] font-bold text-[#1E1B4B] truncate">{value}</p>
      </div>
    </div>
  );
}

function Row({ tint, icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left shadow-sm"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tint}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-bold text-[#1E1B4B]">{title}</h3>
        <p className="text-[12px] text-gray-500 mt-0.5 truncate">{desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </button>
  );
}

function EditContactModal({ initial, onClose, onSaved }) {
  const [username, setUsername] = useState(initial.username || "");
  const [email,    setEmail]    = useState(initial.email    || "");
  const [phone,    setPhone]    = useState(initial.phone    || "");
  const [loading,  setLoading]  = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      Swal.fire({ icon: "warning", title: "Username kosong", text: "Username wajib diisi" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await ownerApi.put("/owner/profile/contact", {
        username: username.trim(),
        email:    email.trim(),
        phone:    phone.trim(),
      });
      onSaved(data);
      await Swal.fire({ icon: "success", title: "Berhasil", text: data.message || "Kontak diperbarui" });
      onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyimpan" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-end justify-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] bg-white rounded-t-3xl px-5 pt-4 pb-7 max-h-[88vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3" />
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#1E1B4B]">Edit Kontak</h3>
          <button type="button" onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <label className="block text-[12px] font-semibold text-[#1E1B4B] mt-4 mb-1.5">No. HP</label>
        <input
          type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx..."
          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-3 text-[14px] focus:outline-none focus:border-[#1E1B4B] focus:bg-white mb-3"
        />

        <label className="block text-[12px] font-semibold text-[#1E1B4B] mb-1.5">Email</label>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com"
          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-3 text-[14px] focus:outline-none focus:border-[#1E1B4B] focus:bg-white mb-3"
        />

        <label className="block text-[12px] font-semibold text-[#1E1B4B] mb-1.5">Username</label>
        <input
          type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username"
          required
          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-3 text-[14px] focus:outline-none focus:border-[#1E1B4B] focus:bg-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-5 bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3 rounded-xl shadow disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}

function ChangePwModal({ onClose }) {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [conf, setConf] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (nw !== conf) {
      Swal.fire({ icon: "warning", title: "Tidak cocok", text: "Konfirmasi password tidak sama" });
      return;
    }
    setLoading(true);
    try {
      await ownerApi.post("/owner/profile/change-password", {
        currentPassword: cur,
        newPassword: nw,
      });
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Password berhasil diubah" });
      onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal mengubah password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-end justify-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] bg-white rounded-t-3xl px-5 pt-4 pb-7 max-h-[88vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3" />
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#1E1B4B]">Change Password</h3>
          <button type="button" onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <label className="block text-[12px] font-semibold text-[#1E1B4B] mt-4 mb-1.5">Password Lama</label>
        <div className="relative mb-3">
          <input
            type={show1 ? "text" : "password"} value={cur} onChange={(e) => setCur(e.target.value)}
            placeholder="••••••••" required
            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 pr-10 py-3 text-[14px] focus:outline-none focus:border-[#1E1B4B] focus:bg-white"
          />
          <button type="button" onClick={() => setShow1((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {show1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <label className="block text-[12px] font-semibold text-[#1E1B4B] mb-1.5">Password Baru (min 6)</label>
        <div className="relative mb-3">
          <input
            type={show2 ? "text" : "password"} value={nw} onChange={(e) => setNw(e.target.value)}
            placeholder="••••••••" required minLength={6}
            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 pr-10 py-3 text-[14px] focus:outline-none focus:border-[#1E1B4B] focus:bg-white"
          />
          <button type="button" onClick={() => setShow2((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {show2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <label className="block text-[12px] font-semibold text-[#1E1B4B] mb-1.5">Konfirmasi Password Baru</label>
        <input
          type={show2 ? "text" : "password"} value={conf} onChange={(e) => setConf(e.target.value)}
          placeholder="••••••••" required minLength={6}
          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-3 text-[14px] focus:outline-none focus:border-[#1E1B4B] focus:bg-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-5 bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3 rounded-xl shadow disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
