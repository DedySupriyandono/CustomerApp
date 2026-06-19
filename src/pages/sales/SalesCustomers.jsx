import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Plus, User as UserIcon, Phone, MapPin, Clock,
  AlertTriangle,
} from "lucide-react";
import salesApi from "../../api/salesApi";

// Daftar customer milik sales login. Click row → detail.
// Header punya tombol "+" utk register customer baru.
export default function SalesCustomers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [pendingRegs, setPendingRegs] = useState([]);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(location.state?.toast || "");

  const fetchData = (search = q, status = filterStatus) => {
    setLoading(true);
    salesApi
      .get("/sales/customers", { params: { q: search || undefined, status: status || undefined } })
      .then((r) => setRows(r.data || []))
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
    // Pending/rejected registrations sales — section terpisah di atas list.
    salesApi
      .get("/sales/registrations/pending")
      .then((r) => setPendingRegs(r.data || []))
      .catch(() => setPendingRegs([]));
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  // Auto-dismiss toast setelah 4 detik.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const onSearch = (e) => {
    e.preventDefault();
    fetchData();
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
        <h1 className="flex-1 text-base font-bold text-[#1A0000]">Customer Saya</h1>
        <button
          onClick={() => navigate("/sales/customers/new")}
          className="w-9 h-9 rounded-full bg-[#B20605] text-white flex items-center justify-center"
          aria-label="Tambah Customer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <form onSubmit={onSearch} className="px-4 pt-3 pb-2 flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / HP / kode..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#F6F3F3] rounded-xl focus:outline-none focus:border-[#B20605]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); fetchData(q, e.target.value); }}
          className="text-sm border border-[#F6F3F3] rounded-xl px-2 py-2.5"
        >
          <option value="">Semua</option>
          <option value="Active">Aktif</option>
          <option value="Inactive">Nonaktif</option>
        </select>
      </form>

      {toast && (
        <div className="mx-4 mb-2 text-[12px] text-[#1A0000] bg-[#FFF5F5] border border-[#FECECE] rounded-lg p-2.5 flex items-start gap-2">
          <Clock className="w-4 h-4 text-[#B20605] shrink-0 mt-0.5" />
          <span className="flex-1">{toast}</span>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}

      {/* Pending Registrations — kalau ada antrian sales yg blm di-approve */}
      {pendingRegs.length > 0 && (
        <div className="px-4 mb-3">
          <div className="text-[11px] uppercase tracking-wide font-bold text-[#B20605] mb-2 px-1">
            Menunggu Approval Admin ({pendingRegs.length})
          </div>
          <ul className="space-y-2">
            {pendingRegs.map((p) => (
              <li key={p.id}
                className={`bg-white border rounded-2xl p-3 flex items-start gap-3 ${
                  p.status === "Rejected"
                    ? "border-red-200"
                    : "border-amber-200"
                }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  p.status === "Rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                }`}>
                  {p.status === "Rejected"
                    ? <AlertTriangle className="w-5 h-5" />
                    : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#1A0000] truncate">{p.customerName}</div>
                  <div className="text-[11px] text-gray-400 font-mono">{p.customerCode}</div>
                  {p.phone && (
                    <div className="text-[12px] text-gray-600 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3" /> {p.phone}
                    </div>
                  )}
                  <div className={`text-[11px] mt-1 font-semibold ${
                    p.status === "Rejected" ? "text-red-600" : "text-amber-700"
                  }`}>
                    {p.status === "Rejected" ? "❌ Ditolak admin" : "⏳ Menunggu approval"}
                  </div>
                  {p.approvalNotes && (
                    <div className="text-[11px] text-gray-500 mt-0.5">"{p.approvalNotes}"</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-4">
        {loading ? (
          <div className="text-center text-gray-400 py-10">Memuat...</div>
        ) : rows.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">
            Belum ada customer. Klik "+" di kanan atas untuk tambah baru.
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/sales/customers/${c.id}`)}
                  className="w-full bg-white border border-[#F6F3F3] rounded-2xl p-3 flex items-start gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FFF5F5] text-[#B20605] flex items-center justify-center shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[14px] font-semibold text-[#1A0000] truncate">
                        {c.customerName}
                      </span>
                      <StatusPill status={c.status} />
                      {c.hasPendingApproval && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>
                    {c.customerCode && (
                      <div className="text-[11px] text-gray-400 font-mono mb-0.5">{c.customerCode}</div>
                    )}
                    {c.phone && (
                      <div className="text-[12px] text-gray-600 flex items-center gap-1.5">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </div>
                    )}
                    {(c.address1 || c.regency) && (
                      <div className="text-[12px] text-gray-500 flex items-start gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="truncate">{c.address1 || c.regency}</span>
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const isActive = status === "Active";
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
        isActive
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-gray-100 text-gray-600 border border-gray-200"
      }`}
    >
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
}
