import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  Building2,
  IdCard,
  User as UserIcon,
  LogOut,
  ChevronRight,
  Pencil,
  KeyRound,
  BookOpen,
} from "lucide-react";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import BottomNav from "../components/BottomNav";
import BottomSheet from "../components/BottomSheet";

export default function Profile() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // 'contact' | 'location' | 'password' | null

  const load = () => {
    setLoading(true);
    api
      .get("/customer/me")
      .then((r) => setData(r.data))
      .catch((e) => {
        console.error("[Profile]", e);
        setError(e.response?.data?.message || e.message || "Gagal memuat profil");
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const customer = data || user || {};
  const initial = customer.customerName?.[0]?.toUpperCase() || "C";

  return (
    <div
      className="mobile-container relative shadow-2xl pb-28"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[220px] bg-gradient-to-b from-[#540101] to-[#2A0000] z-0" />

      <div className="relative z-10">
        <header className="flex items-center justify-between px-5 pt-12 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-base font-bold leading-[26px]">Profil</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/notifications")} aria-label="Notifikasi" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
            </button>
            <button
              onClick={() => navigate("/checkout")}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center relative"
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

        <div className="px-5">
          <div className="bg-white rounded-2xl p-5 shadow-[0_2px_15px_rgba(0,0,0,0.06)] border border-[#F6F3F3] flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B20605] to-[#540101] text-white flex items-center justify-center text-2xl font-bold shrink-0">
              {customer.image ? (
                <img src={customer.image} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                initial
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[#1A0000] text-[16px] truncate">
                {customer.customerName || "—"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">
                {customer.customerCode || customer.uid || ""}
              </div>
              {customer.salesName && (
                <div className="text-[11px] text-gray-400 mt-1 truncate">Sales: {customer.salesName}</div>
              )}
            </div>
            {customer.status && (
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-semibold shrink-0">
                {customer.status}
              </span>
            )}
          </div>
        </div>

        <section className="bg-[#FBF9F9] rounded-t-[20px] mt-5 min-h-[calc(100vh-260px)] px-5 pt-5">
          {loading && <div className="text-center text-gray-400 py-8 text-sm">Memuat profil...</div>}
          {!loading && error && <div className="text-center text-red-600 py-6 text-sm">{error}</div>}

          {!loading && (
            <>
              {/* Contact */}
              <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] overflow-hidden">
                <SectionHeader title="Kontak" onEdit={() => setEditing("contact")} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="No. HP" value={customer.phone} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={customer.email} />
                <InfoRow
                  icon={<UserIcon className="w-4 h-4" />}
                  label="Contact Person"
                  value={customer.contactPerson}
                />
              </div>

              {/* Lokasi */}
              <div className="bg-white rounded-2xl mt-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] overflow-hidden">
                <SectionHeader title="Lokasi" onEdit={() => setEditing("location")} />
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Alamat"
                  value={[customer.address, customer.address2].filter(Boolean).join(", ")}
                />
                <InfoRow label="Kelurahan" value={customer.village} />
                <InfoRow label="Kecamatan" value={customer.subDistrict} />
                <InfoRow label="Kabupaten / Kota" value={customer.regency || customer.city} />
                <InfoRow label="Kode Pos" value={customer.zipCode} />
              </div>

              {/* Cabang */}
              <div className="bg-white rounded-2xl mt-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] overflow-hidden">
                <SectionHeader title="Cabang" />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Regional" value={customer.regional} />
                <InfoRow label="Branch" value={customer.branch} />
                {customer.subBranch && <InfoRow label="Sub Branch" value={customer.subBranch} />}
                <InfoRow label="Warehouse" value={customer.warehouseName} />
              </div>

              {/* Identitas */}
              {(customer.idCardNumber || customer.taxNumber) && (
                <div className="bg-white rounded-2xl mt-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-[#F6F3F3] overflow-hidden">
                  <SectionHeader title="Identitas" />
                  <InfoRow icon={<IdCard className="w-4 h-4" />} label="No. KTP" value={customer.idCardNumber} />
                  <InfoRow label="No. NPWP" value={customer.taxNumber} />
                </div>
              )}

              {/* Buku Manual */}
              <button
                onClick={() => navigate("/manual")}
                className="w-full mt-4 bg-white border border-[#F6F3F3] rounded-2xl px-4 py-4 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FFF5F5] text-[#B20605] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left font-semibold text-[14px] text-[#1A0000]">
                  Buku Manual
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* Password */}
              <button
                onClick={() => setEditing("password")}
                className="w-full mt-3 bg-white border border-[#F6F3F3] rounded-2xl px-4 py-4 flex items-center gap-3"
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
                  navigate("/login", { replace: true });
                }}
                className="w-full mt-3 bg-white border border-[#B20605] text-[#B20605] font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Keluar
              </button>

              <div className="text-center text-[11px] text-gray-400 mt-4">MDPOS Customer · v1.0</div>
            </>
          )}
        </section>
      </div>

      <BottomNav />

      <BottomSheet open={editing === "contact"} onClose={() => setEditing(null)} title="Edit Kontak">
        <ContactForm customer={customer} onDone={() => { setEditing(null); load(); }} />
      </BottomSheet>

      <BottomSheet open={editing === "location"} onClose={() => setEditing(null)} title="Edit Lokasi">
        <LocationForm customer={customer} onDone={() => { setEditing(null); load(); }} />
      </BottomSheet>

      <BottomSheet open={editing === "password"} onClose={() => setEditing(null)} title="Ubah Password">
        <PasswordForm onDone={() => setEditing(null)} />
      </BottomSheet>
    </div>
  );
}

function SectionHeader({ title, onEdit }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <div className="text-[11px] font-bold text-[#606060] uppercase tracking-wider">{title}</div>
      {onEdit && (
        <button
          onClick={onEdit}
          aria-label={`Edit ${title}`}
          className="flex items-center gap-1 text-[#B20605] text-[12px] font-semibold"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      )}
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

function FormActions({ onSave, onCancel, loading, saveLabel = "Simpan" }) {
  return (
    <div className="flex gap-2 mt-2">
      <button
        onClick={onCancel}
        type="button"
        className="flex-1 py-3 rounded-xl border border-[#F6F3F3] text-[#606060] font-semibold"
      >
        Batal
      </button>
      <button
        onClick={onSave}
        disabled={loading}
        type="button"
        className="flex-1 py-3 rounded-xl bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-semibold disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : saveLabel}
      </button>
    </div>
  );
}

function ContactForm({ customer, onDone }) {
  const [phone, setPhone] = useState(customer.phone || "");
  const [email, setEmail] = useState(customer.email || "");
  const [contactPerson, setContactPerson] = useState(customer.contactPerson || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setLoading(true);
    setErr("");
    try {
      await api.put("/customer/me/contact", { phone, email, contactPerson });
      onDone();
    } catch (e) {
      setErr(e.response?.data?.message || e.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Field label="No. HP" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
      <Field label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
      <Field
        label="Contact Person"
        value={contactPerson}
        onChange={(e) => setContactPerson(e.target.value)}
      />
      {err && <div className="text-red-600 text-xs mb-2">{err}</div>}
      <FormActions onSave={save} onCancel={onDone} loading={loading} />
    </>
  );
}

function LocationForm({ customer, onDone }) {
  const [address, setAddress] = useState(customer.address || "");
  const [address2, setAddress2] = useState(customer.address2 || "");
  const [village, setVillage] = useState(customer.village || "");
  const [subDistrict, setSubDistrict] = useState(customer.subDistrict || "");
  const [regency, setRegency] = useState(customer.regency || customer.city || "");
  const [zipCode, setZipCode] = useState(customer.zipCode || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setLoading(true);
    setErr("");
    try {
      await api.put("/customer/me/location", {
        address,
        address2,
        village,
        subDistrict,
        regency,
        zipCode,
      });
      onDone();
    } catch (e) {
      setErr(e.response?.data?.message || e.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Field label="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} />
      <Field label="Alamat 2 (Opsional)" value={address2} onChange={(e) => setAddress2(e.target.value)} />
      <Field label="Kelurahan" value={village} onChange={(e) => setVillage(e.target.value)} />
      <Field label="Kecamatan" value={subDistrict} onChange={(e) => setSubDistrict(e.target.value)} />
      <Field label="Kabupaten / Kota" value={regency} onChange={(e) => setRegency(e.target.value)} />
      <Field label="Kode Pos" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
      {err && <div className="text-red-600 text-xs mb-2">{err}</div>}
      <FormActions onSave={save} onCancel={onDone} loading={loading} />
    </>
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
    if (next.length < 4) {
      setErr("Password baru minimal 4 karakter");
      return;
    }
    if (next !== confirm) {
      setErr("Konfirmasi password tidak cocok");
      return;
    }
    setLoading(true);
    try {
      await api.post("/customer/me/password", { currentPassword: current, newPassword: next });
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
      <Field
        label="Password Lama"
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <Field
        label="Password Baru"
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <Field
        label="Konfirmasi Password Baru"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {err && <div className="text-red-600 text-xs mb-2">{err}</div>}
      {ok && <div className="text-green-600 text-xs mb-2">{ok}</div>}
      <FormActions onSave={save} onCancel={onDone} loading={loading} saveLabel="Ubah Password" />
    </>
  );
}
