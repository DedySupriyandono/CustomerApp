import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, MapPin, User as UserIcon,
  CheckCircle, AlertTriangle, Clock,
} from "lucide-react";
import salesApi from "../../api/salesApi";

// Detail customer milik sales + tombol request ubah status.
// Status change butuh approval admin → tombol akan jadi disabled & show
// "Pending approval" kalau sudah ada request yg belum di-respon admin.
export default function SalesCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");

  const fetchData = () => {
    setLoading(true);
    salesApi
      .get(`/sales/customers/${id}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [id]);

  const targetStatus = data?.status === "Active" ? "Inactive" : "Active";

  const submitRequest = async () => {
    if (!reason.trim()) {
      setToast("Alasan wajib diisi.");
      return;
    }
    setSubmitting(true);
    setToast("");
    try {
      await salesApi.post(`/sales/customers/${id}/status-request`, {
        newStatus: targetStatus,
        reason: reason.trim(),
      });
      setToast("Request terkirim, menunggu approval admin.");
      setShowForm(false);
      setReason("");
      fetchData();
    } catch (e) {
      setToast(e.response?.data?.message || "Gagal mengirim request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen text-gray-400">
        Memuat...
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen text-red-600 p-6 text-center">
        {error || "Customer tidak ditemukan"}
      </div>
    );
  }

  const pending = data.pending;

  return (
    <div
      className="mobile-container relative shadow-2xl pb-24 bg-white"
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
        <h1 className="flex-1 text-base font-bold text-[#1A0000]">Detail Customer</h1>
      </header>

      <div className="px-4 pt-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#FFF5F5] text-[#B20605] flex items-center justify-center">
            <UserIcon className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-[#1A0000] text-lg truncate">{data.customerName}</h2>
            {data.customerCode && (
              <div className="text-[11px] text-gray-400 font-mono">{data.customerCode}</div>
            )}
          </div>
          <StatusPill status={data.status} />
        </div>

        {/* Info card */}
        <div className="bg-white border border-[#F6F3F3] rounded-2xl p-4 mb-3 space-y-2.5">
          {data.contactPerson && (
            <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Contact" value={data.contactPerson} />
          )}
          {data.phone && (
            <InfoRow icon={<Phone className="w-4 h-4" />} label="HP" value={data.phone} />
          )}
          {data.email && (
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={data.email} />
          )}
          {(data.address1 || data.city || data.regency) && (
            <InfoRow
              icon={<MapPin className="w-4 h-4" />}
              label="Alamat"
              value={[data.address1, data.city, data.regency].filter(Boolean).join(", ")}
            />
          )}
        </div>

        {/* Pending request notice */}
        {pending && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3 flex items-start gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-[12px]">
              <div className="font-semibold text-amber-800">
                Menunggu approval admin
              </div>
              <div className="text-amber-700 mt-0.5">
                Ubah ke <strong>{pending.newStatus === "Active" ? "Aktif" : "Nonaktif"}</strong>
              </div>
              {pending.reason && (
                <div className="text-amber-600 text-[11px] mt-0.5">"{pending.reason}"</div>
              )}
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="mb-3 text-xs text-center text-[#1A0000] bg-[#FFF5F5] border border-[#FECECE] rounded-lg p-2">
            {toast}
          </div>
        )}

        {/* Action area */}
        {!showForm ? (
          <button
            disabled={!!pending}
            onClick={() => setShowForm(true)}
            className={`w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 ${
              pending
                ? "bg-gray-100 text-gray-400"
                : data.status === "Active"
                ? "bg-white text-[#B20605] border border-[#B20605]"
                : "bg-[#B20605] text-white"
            }`}
          >
            {data.status === "Active" ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                Request Nonaktifkan Customer
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Request Aktifkan Customer
              </>
            )}
          </button>
        ) : (
          <div className="bg-white border border-[#F6F3F3] rounded-2xl p-3">
            <div className="text-[13px] font-semibold text-[#1A0000] mb-2">
              Alasan ubah status ke <strong>{targetStatus === "Active" ? "Aktif" : "Nonaktif"}</strong>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Tulis alasan singkat untuk admin..."
              className="w-full text-sm border border-[#F6F3F3] rounded-xl p-2.5 focus:outline-none focus:border-[#B20605]"
              maxLength={500}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { setShowForm(false); setReason(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-600"
              >
                Batal
              </button>
              <button
                disabled={submitting || !reason.trim()}
                onClick={submitRequest}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#B20605] text-white disabled:bg-gray-300"
              >
                {submitting ? "Mengirim..." : "Kirim Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 text-[13px]">
      <div className="text-[#B20605] mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</div>
        <div className="text-[#1A0000] break-words">{value}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const isActive = status === "Active";
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
        isActive
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-gray-100 text-gray-600 border border-gray-200"
      }`}
    >
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
}
