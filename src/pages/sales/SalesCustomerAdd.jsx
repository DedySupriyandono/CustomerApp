import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import salesApi from "../../api/salesApi";

// Form tambah customer baru di bawah sales login.
// Region/Branch/Warehouse auto dari profil sales (server-side).
export default function SalesCustomerAdd() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address1: "",
    city: "",
    regency: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) { setError("Nama customer wajib."); return; }
    if (!form.phone.trim()) { setError("Nomor HP wajib."); return; }
    setSubmitting(true);
    setError("");
    try {
      const r = await salesApi.post("/sales/customers", form);
      // Sukses → langsung ke detail customer baru.
      if (r.data?.id) {
        navigate(`/sales/customers/${r.data.id}`, { replace: true });
      } else {
        navigate("/sales/customers", { replace: true });
      }
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
        <Field label="Nama Customer *" value={form.customerName} onChange={set("customerName")} required maxLength={100} />
        <Field label="Contact Person"   value={form.contactPerson} onChange={set("contactPerson")} maxLength={100} />
        <Field label="Nomor HP *"        value={form.phone}        onChange={set("phone")} required type="tel" inputMode="tel" maxLength={15} />
        <Field label="Email"             value={form.email}        onChange={set("email")} type="email" maxLength={100} />
        <Field label="Alamat"            value={form.address1}     onChange={set("address1")} textarea rows={2} />
        <Field label="Kota"              value={form.city}         onChange={set("city")} maxLength={50} />
        <Field label="Kabupaten"         value={form.regency}      onChange={set("regency")} maxLength={50} />

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-2xl text-sm font-semibold bg-[#B20605] text-white flex items-center justify-center gap-2 disabled:bg-gray-300"
        >
          <UserPlus className="w-4 h-4" />
          {submitting ? "Menyimpan..." : "Simpan Customer"}
        </button>
        <div className="text-[11px] text-center text-gray-400 mt-1">
          Region & branch otomatis menggunakan profil sales Anda.
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
