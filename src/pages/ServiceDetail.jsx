import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";
import Swal from "sweetalert2";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import { rupiah } from "../utils/format";

export default function ServiceDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState("COD");
  const [submitting, setSubmitting] = useState(false);

  // Order jasa: qty selalu 1 (tidak dapat diubah customer).
  const qty = 1;

  useEffect(() => {
    setLoading(true);
    api
      .get(`/customer/services/${encodeURIComponent(uid)}`)
      .then((r) => setData(r.data))
      .catch((e) =>
        setError(e.response?.data?.message || e.message || "Gagal memuat layanan")
      )
      .finally(() => setLoading(false));
  }, [uid]);

  const price = data?.salesPrice ?? 0;
  const total = price * qty;

  const submit = async () => {
    if (!data) return;
    if (!note.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Keterangan wajib diisi",
        text: "Mohon tuliskan detail kebutuhan jasa sebelum melanjutkan.",
        confirmButtonColor: "#B20605",
      });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        branchId: user?.branchId ? Number(user.branchId) : null,
        notes: note.trim(),
        paymentMethod: payment,
        items: [{ productId: data.id, quantity: qty }],
      };
      const { data: res } = await api.post("/customer/services/order", payload);
      navigate(`/success/${res.id}`, { replace: true });
    } catch (e) {
      const d = e.response?.data || {};
      Swal.fire({
        icon: "error",
        title: "Gagal pesan jasa",
        text: d.message || d.detail || e.message || "Gagal membuat order jasa.",
        confirmButtonColor: "#B20605",
      });
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
  if (error || !data) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen text-red-600 p-6 text-center">
        {error || "Layanan tidak ditemukan"}
      </div>
    );
  }

  return (
    <div
      className="mobile-container relative shadow-2xl pb-32"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b from-[#540101] to-[#2A0000] z-0" />

      <div className="relative z-10">
        <header className="flex items-center gap-3.5 px-5 pt-12 pb-5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-base font-bold">Detail Jasa</h1>
        </header>

        <section className="bg-[#FBF9F9] rounded-t-[20px] min-h-[calc(100vh-180px)] px-5 pt-5">
          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl bg-[#FFF5F5] flex items-center justify-center shrink-0">
                <Wrench className="w-8 h-8 text-[#B20605]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[16px] text-[#1A0000]">
                  {data.productName}
                </div>
                {data.categoryName && (
                  <div className="text-[11px] text-[#606060] mt-1">
                    {data.categoryName}
                    {data.brandName && <> · {data.brandName}</>}
                  </div>
                )}
                <div className="text-[#B20605] font-bold text-[18px] mt-2">
                  {rupiah(price)}
                </div>
              </div>
            </div>
            {data.description && (
              <div className="mt-4 pt-4 border-t border-[#F6F3F3]">
                <div className="text-[11px] uppercase tracking-wider text-[#606060] mb-1">
                  Deskripsi
                </div>
                <div className="text-[13px] text-[#1A0000] whitespace-pre-wrap">
                  {data.description}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 mt-3 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
            <h3 className="font-semibold text-[14px] text-[#1A0000] mb-2">
              Keterangan <span className="text-[#B20605]">*</span>
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              rows={4}
              placeholder="Tulis detail kebutuhan jasa, jadwal, lokasi, dll..."
              required
              className="w-full bg-[#FBF9F9] rounded-xl p-3 text-sm border border-[#F6F3F3] focus:outline-none focus:border-[#B20605] resize-none"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={note.trim().length === 0 ? "text-[#B20605]" : "text-gray-400"}>
                {note.trim().length === 0 ? "Wajib diisi" : " "}
              </span>
              <span className="text-gray-400">{note.length}/200</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 mt-3 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
            <h3 className="font-semibold text-[14px] text-[#1A0000] mb-3">
              Metode Pembayaran
            </h3>
            {[
              { v: "COD", label: "Cash On Delivery (COD)", icon: "💵" },
              { v: "Transfer Bank", label: "Transfer Bank", sub: "Bank BCA", icon: "🏦" },
            ].map((p) => (
              <label
                key={p.v}
                className={`block border-2 rounded-xl p-3 mb-2 cursor-pointer ${
                  payment === p.v ? "border-[#B20605] bg-[#FFF5F5]" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={payment === p.v}
                  onChange={() => setPayment(p.v)}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FFF5F5] flex items-center justify-center">
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{p.label}</div>
                    {p.sub && (
                      <div className="text-xs text-gray-500">{p.sub}</div>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 ${
                      payment === p.v
                        ? "border-[#B20605] bg-[#B20605]"
                        : "border-gray-300"
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-4 mt-3 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-[#F6F3F3]">
            <div className="flex justify-between text-sm">
              <span className="text-[#606060]">Subtotal</span>
              <span className="text-[#1A0000]">{rupiah(price * qty)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2 pt-2 border-t border-dashed">
              <span>Total</span>
              <span className="text-[#B20605]">{rupiah(total)}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 z-40">
        <div className="flex-1">
          <div className="text-[11px] text-gray-500">Total</div>
          <div className="font-bold text-[#1A0000]">{rupiah(total)}</div>
        </div>
        <button
          onClick={submit}
          disabled={submitting || !note.trim()}
          className="bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-semibold px-8 py-3 rounded-full shadow-lg disabled:opacity-50"
        >
          {submitting ? "Memproses..." : "Pesan Jasa"}
        </button>
      </div>
    </div>
  );
}
