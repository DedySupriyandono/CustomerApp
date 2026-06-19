import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Check, X } from "lucide-react";
import salesApi from "../../api/salesApi";

// Form tambah customer baru di bawah sales login.
// CustomerCode di-input sales (bukan auto-generate) — divalidasi unique
// system-wide. Region/Branch auto dari profil sales. Warehouse:
//   - Sales locked → auto pakai gudangnya (dropdown disabled)
//   - Sales akses multi gudang → pilih dari dropdown
export default function SalesCustomerAdd() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerCode: "",
    customerName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address1: "",
    city: "",
    regency: "",
    warehouseId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [codeStatus, setCodeStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [codeMessage, setCodeMessage] = useState("");
  const codeTimer = useRef(null);
  const [phoneStatus, setPhoneStatus] = useState(null);
  const [phoneMessage, setPhoneMessage] = useState("");
  const phoneTimer = useRef(null);
  const [warehouses, setWarehouses] = useState([]);
  const [whLoading, setWhLoading] = useState(true);

  // Load warehouses dari /sales/warehouses (sudah scoped by branch sales).
  useEffect(() => {
    setWhLoading(true);
    salesApi
      .get("/sales/warehouses")
      .then((r) => {
        const list = r.data || [];
        setWarehouses(list);
        // Auto-select kalau cuma 1 opsi.
        if (list.length === 1) {
          setForm((s) => ({ ...s, warehouseId: String(list[0].id) }));
        }
      })
      .catch(() => setWarehouses([]))
      .finally(() => setWhLoading(false));
  }, []);

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  // Real-time cek availability phone dgn debounce 500ms.
  const onPhoneChange = (e) => {
    const value = e.target.value.trim();
    setForm((s) => ({ ...s, phone: value }));
    setPhoneStatus(null);
    setPhoneMessage("");
    if (phoneTimer.current) clearTimeout(phoneTimer.current);
    if (!value) return;
    setPhoneStatus("checking");
    phoneTimer.current = setTimeout(async () => {
      try {
        const r = await salesApi.get("/sales/customers/check-phone", { params: { phone: value } });
        if (r.data?.available) {
          setPhoneStatus("available");
          setPhoneMessage(r.data.message || "Nomor HP tersedia.");
        } else {
          setPhoneStatus("taken");
          setPhoneMessage(r.data?.message || "Nomor HP sudah dipakai.");
        }
      } catch {
        setPhoneStatus(null);
        setPhoneMessage("");
      }
    }, 500);
  };

  // Real-time cek availability customer code dgn debounce 500ms.
  const onCodeChange = (e) => {
    const value = e.target.value.trim();
    setForm((s) => ({ ...s, customerCode: value }));
    setCodeStatus(null);
    setCodeMessage("");
    if (codeTimer.current) clearTimeout(codeTimer.current);
    if (!value) return;
    setCodeStatus("checking");
    codeTimer.current = setTimeout(async () => {
      try {
        const r = await salesApi.get("/sales/customers/check-code", { params: { code: value } });
        if (r.data?.available) {
          setCodeStatus("available");
          setCodeMessage(r.data.message || "Code tersedia.");
        } else {
          setCodeStatus("taken");
          setCodeMessage(r.data?.message || "Code sudah dipakai.");
        }
      } catch {
        setCodeStatus(null);
        setCodeMessage("");
      }
    }, 500);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customerCode.trim()) { setError("Customer Code wajib."); return; }
    if (codeStatus === "taken") { setError(codeMessage || "Customer Code sudah dipakai."); return; }
    if (!form.customerName.trim()) { setError("Nama customer wajib."); return; }
    if (!form.phone.trim()) { setError("Nomor HP wajib."); return; }
    if (phoneStatus === "taken") { setError(phoneMessage || "Nomor HP sudah dipakai."); return; }
    if (warehouses.length > 1 && !form.warehouseId) { setError("Pilih gudang."); return; }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        warehouseId: form.warehouseId ? Number(form.warehouseId) : null,
      };
      const r = await salesApi.post("/sales/customers", payload);
      // Customer baru sekarang masuk antrian approval. Balik ke list dgn
      // toast info — TIDAK navigate ke detail karena belum ada customer.id.
      const msg = r.data?.message || "Pendaftaran customer terkirim, menunggu approval admin.";
      navigate("/sales/customers", {
        replace: true,
        state: { toast: msg, toastVariant: "info" },
      });
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Gagal mendaftar customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="mobile-container relative shadow-2xl pb-12 bg-white"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <header className="sticky top-0 z-30 bg-white border-b border-[#F6F3F3] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-[#FFF5F5] flex items-center justify-center"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5 text-[#B20605]" />
        </button>
        <h1 className="flex-1 text-base font-bold text-[#1A0000]">Tambah Customer</h1>
      </header>

      <form onSubmit={submit} className="px-4 pt-4 space-y-3">
        {/* Customer Code dgn live check */}
        <label className="block">
          <span className="text-[12px] font-semibold text-[#1A0000]">Customer Code *</span>
          <div className="relative">
            <input
              value={form.customerCode}
              onChange={onCodeChange}
              required
              maxLength={10}
              placeholder="contoh: CUST001"
              className={`mt-1 w-full text-sm border rounded-xl p-2.5 pr-10 focus:outline-none uppercase
                ${codeStatus === "taken"      ? "border-red-400 focus:border-red-500"
                : codeStatus === "available"  ? "border-green-400 focus:border-green-500"
                                              : "border-[#F6F3F3] focus:border-[#B20605]"}`}
              style={{ textTransform: "uppercase" }}
            />
            {codeStatus === "checking" && (
              <span className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-[10px] text-gray-400">cek...</span>
            )}
            {codeStatus === "available" && (
              <Check className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 w-4 h-4 text-green-600" />
            )}
            {codeStatus === "taken" && (
              <X className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 w-4 h-4 text-red-600" />
            )}
          </div>
          {codeMessage && (
            <div className={`text-[11px] mt-1 ${
              codeStatus === "taken" ? "text-red-600" :
              codeStatus === "available" ? "text-green-600" : "text-gray-500"
            }`}>
              {codeMessage}
            </div>
          )}
          <div className="text-[11px] text-gray-400 mt-0.5">Maks 10 karakter, harus unik di seluruh sistem.</div>
        </label>

        <Field label="Nama Customer *" value={form.customerName} onChange={set("customerName")} required maxLength={100} />
        <Field label="Contact Person"   value={form.contactPerson} onChange={set("contactPerson")} maxLength={100} />

        {/* Nomor HP dgn live check uniqueness */}
        <label className="block">
          <span className="text-[12px] font-semibold text-[#1A0000]">Nomor HP *</span>
          <div className="relative">
            <input
              value={form.phone}
              onChange={onPhoneChange}
              required
              type="tel"
              inputMode="tel"
              maxLength={15}
              placeholder="08xxxxxxxxxx"
              className={`mt-1 w-full text-sm border rounded-xl p-2.5 pr-10 focus:outline-none
                ${phoneStatus === "taken"      ? "border-red-400 focus:border-red-500"
                : phoneStatus === "available"  ? "border-green-400 focus:border-green-500"
                                              : "border-[#F6F3F3] focus:border-[#B20605]"}`}
            />
            {phoneStatus === "checking" && (
              <span className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-[10px] text-gray-400">cek...</span>
            )}
            {phoneStatus === "available" && (
              <Check className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 w-4 h-4 text-green-600" />
            )}
            {phoneStatus === "taken" && (
              <X className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 w-4 h-4 text-red-600" />
            )}
          </div>
          {phoneMessage && (
            <div className={`text-[11px] mt-1 ${
              phoneStatus === "taken" ? "text-red-600" :
              phoneStatus === "available" ? "text-green-600" : "text-gray-500"
            }`}>
              {phoneMessage}
            </div>
          )}
          <div className="text-[11px] text-gray-400 mt-0.5">Harus unik di seluruh sistem.</div>
        </label>
        <Field label="Email"             value={form.email}        onChange={set("email")} type="email" maxLength={100} />
        <Field label="Alamat"            value={form.address1}     onChange={set("address1")} textarea rows={2} />
        <Field label="Kota"              value={form.city}         onChange={set("city")} maxLength={50} />
        <Field label="Kabupaten"         value={form.regency}      onChange={set("regency")} maxLength={50} />

        {/* Warehouse — dropdown dari /sales/warehouses (scoped by branch).
            Auto-select & disabled kalau cuma 1 opsi. */}
        <label className="block">
          <span className="text-[12px] font-semibold text-[#1A0000]">
            Gudang {warehouses.length > 1 && <span className="text-red-600">*</span>}
          </span>
          {whLoading ? (
            <div className="mt-1 text-sm text-gray-400 p-2.5">Memuat gudang...</div>
          ) : warehouses.length === 0 ? (
            <div className="mt-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5">
              Tidak ada gudang yang tersedia untuk Anda.
            </div>
          ) : (
            <select
              value={form.warehouseId}
              onChange={set("warehouseId")}
              disabled={warehouses.length === 1}
              required={warehouses.length > 1}
              className="mt-1 w-full text-sm border border-[#F6F3F3] rounded-xl p-2.5 focus:outline-none focus:border-[#B20605] disabled:bg-gray-50 disabled:text-gray-500"
            >
              {warehouses.length > 1 && <option value="">-- Pilih Gudang --</option>}
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.code ? `(${w.code})` : ""}
                </option>
              ))}
            </select>
          )}
          {warehouses.length === 1 && (
            <div className="text-[11px] text-gray-400 mt-0.5">Gudang otomatis sesuai profil sales Anda.</div>
          )}
        </label>

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting
            || codeStatus === "taken" || codeStatus === "checking"
            || phoneStatus === "taken" || phoneStatus === "checking"}
          className="w-full py-3 rounded-2xl text-sm font-semibold bg-[#B20605] text-white flex items-center justify-center gap-2 disabled:bg-gray-300"
        >
          <UserPlus className="w-4 h-4" />
          {submitting ? "Menyimpan..." : "Simpan Customer"}
        </button>
        <div className="text-[11px] text-center text-gray-400 mt-1">
          Region & branch otomatis dari profil sales Anda.
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, textarea, rows, ...rest }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-[#1A0000]">{label}</span>
      {textarea ? (
        <textarea
          rows={rows || 3}
          value={value}
          onChange={onChange}
          className="mt-1 w-full text-sm border border-[#F6F3F3] rounded-xl p-2.5 focus:outline-none focus:border-[#B20605]"
          {...rest}
        />
      ) : (
        <input
          value={value}
          onChange={onChange}
          className="mt-1 w-full text-sm border border-[#F6F3F3] rounded-xl p-2.5 focus:outline-none focus:border-[#B20605]"
          {...rest}
        />
      )}
    </label>
  );
}
