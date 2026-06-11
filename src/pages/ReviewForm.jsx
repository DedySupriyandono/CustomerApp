import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Camera, X } from "lucide-react";
import api from "../api/api";

export default function ReviewForm() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customer/orders/${orderId}/review`)
      .then(r => {
        if (r.data) {
          setExisting(r.data);
          setRating(r.data.rating || 5);
          setComment(r.data.comment || "");
          setPhoto(r.data.photo || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const onPhotoChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 800;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
          const r = Math.min(max/w, max/h);
          w = Math.round(w*r); h = Math.round(h*r);
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        setPhoto(c.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (rating < 1) { alert("Pilih rating dulu"); return; }
    setSubmitting(true);
    try {
      await api.post(`/customer/orders/${orderId}/review`, { rating, comment, photo });
      alert("Terima kasih atas ulasan Anda!");
      navigate(`/success/${orderId}`, { replace: true });
    } catch (e) {
      alert(e.response?.data?.message || "Gagal kirim ulasan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mobile-container flex items-center justify-center min-h-screen text-gray-400">Memuat...</div>;

  const ratingLabels = ["", "Sangat Buruk", "Buruk", "Cukup", "Bagus", "Sangat Bagus"];
  const displayRating = hover || rating;

  return (
    <div className="mobile-container relative pb-32" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <div className="absolute top-0 left-0 right-0 h-[140px] bg-gradient-to-b from-[#540101] to-[#2A0000] z-0" />
      <div className="relative z-10">
        <header className="flex items-center gap-3 px-5 pt-12 pb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold">{existing ? "Edit Ulasan" : "Beri Ulasan"}</h1>
        </header>

        <div className="px-4">
          {/* Rating stars */}
          <div className="bg-white rounded-2xl p-5 mb-3 shadow-sm text-center">
            <h3 className="font-semibold text-[16px] mb-1">Bagaimana pengalaman Anda?</h3>
            <p className="text-xs text-gray-500 mb-4">Tap bintang untuk beri rating</p>
            <div className="flex justify-center gap-2 mb-3">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${n <= displayRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                </button>
              ))}
            </div>
            <div className="text-sm font-medium text-[#B20605]">{ratingLabels[displayRating]}</div>
          </div>

          {/* Comment */}
          <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <label className="font-semibold text-[14px] block mb-2">Komentar (opsional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Ceritakan pengalaman Anda dengan pesanan ini..."
              className="w-full bg-gray-50 rounded-xl p-3 text-sm border border-gray-200 focus:outline-none focus:border-[#B20605] resize-none"
            />
            <div className="text-right text-[10px] text-gray-400 mt-1">{comment.length} / 500</div>
          </div>

          {/* Photo */}
          <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <label className="font-semibold text-[14px] block mb-2">Foto (opsional)</label>
            {photo ? (
              <div className="relative inline-block">
                <img src={photo} alt="" className="rounded-lg max-w-full" style={{ maxHeight: 200 }} />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-100">
                <Camera className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-500">Tambah foto produk</span>
                <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
              </label>
            )}
          </div>

          {existing && (
            <div className="text-center text-[11px] text-gray-400 mb-3">
              Ulasan dibuat: {new Date(existing.createdAt).toLocaleDateString("id-ID")}
              {existing.updatedAt && <> · Diedit: {new Date(existing.updatedAt).toLocaleDateString("id-ID")}</>}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 px-4 py-3 z-40">
        <button
          onClick={submit}
          disabled={submitting || rating < 1}
          className="w-full bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50"
        >
          {submitting ? "Mengirim..." : (existing ? "Update Ulasan" : "Kirim Ulasan")}
        </button>
      </div>
    </div>
  );
}
