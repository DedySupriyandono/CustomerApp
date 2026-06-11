import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../api/api";
import { rupiah } from "../utils/format";

const REASONS = ["Salah Barang", "Rusak", "Tidak Sesuai", "Lainnya"];

export default function ReturnRequest() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); // { orderItemId: quantity }

  useEffect(() => {
    api.get(`/customer/orders/${orderId}`)
      .then(r => setOrder(r.data))
      .catch(e => setError(e.response?.data?.message || "Gagal load order"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const toggleItem = (id, maxQty) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = maxQty;
      return next;
    });
  };
  const setItemQty = (id, qty, maxQty) => {
    const q = Math.max(1, Math.min(maxQty, Number(qty) || 1));
    setSelectedItems(prev => ({ ...prev, [id]: q }));
  };

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
        setPhoto(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!reason) { alert("Pilih alasan dulu"); return; }
    const items = Object.entries(selectedItems).map(([id, qty]) => ({
      orderItemId: Number(id), quantity: Number(qty)
    }));
    if (items.length === 0) { alert("Pilih minimal 1 item"); return; }

    setSubmitting(true);
    try {
      const r = await api.post("/customer/returns", {
        orderId: Number(orderId), reason, notes, photo, items
      });
      alert(`Berhasil. Nomor Return: ${r.data.returnNumber}\nMenunggu review sales.`);
      navigate("/orders", { replace: true });
    } catch (e) {
      const data = e.response?.data || {};
      alert(`Error: ${data.message || e.message}${data.detail ? '\n' + data.detail : ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mobile-container flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (error) return <div className="mobile-container flex items-center justify-center min-h-screen text-red-600 p-6 text-center">{error}</div>;

  return (
    <div className="mobile-container relative pb-32" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <div className="absolute top-0 left-0 right-0 h-[140px] bg-gradient-to-b from-[#540101] to-[#2A0000] z-0" />
      <div className="relative z-10">
        <header className="flex items-center gap-3 px-5 pt-12 pb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold">Ajukan Pengembalian</h1>
        </header>

        <div className="px-4">
          <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <h3 className="font-semibold mb-2">Order #{order?.orderNumber}</h3>
            <p className="text-xs text-gray-500">Pilih item yang ingin dikembalikan.</p>
          </div>

          <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <h3 className="font-semibold mb-3">Item</h3>
            <div className="space-y-2">
              {order?.items?.map(it => {
                const isChecked = !!selectedItems[it.id];
                return (
                  <div key={it.id} className={`border rounded-xl p-3 ${isChecked ? "border-[#B20605] bg-[#FFF5F5]" : "border-gray-200"}`}>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" checked={isChecked} onChange={() => toggleItem(it.id, it.quantity)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{it.productName}</div>
                        {it.productCode && <div className="text-[11px] text-gray-500 font-mono">{it.productCode}</div>}
                        <div className="text-[11px] text-gray-500">Qty awal: {it.quantity} · {rupiah(it.unitPrice)}/pcs</div>
                        {isChecked && (
                          <div className="mt-2 flex items-center gap-2">
                            <label className="text-xs">Qty return:</label>
                            <input
                              type="number" min="1" max={it.quantity}
                              value={selectedItems[it.id]}
                              onChange={e => setItemQty(it.id, e.target.value, it.quantity)}
                              className="w-16 border rounded px-2 py-1 text-sm"
                              disabled={it.productCode != null && it.quantity === 1}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <h3 className="font-semibold mb-2">Alasan</h3>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map(r => (
                <button key={r}
                        onClick={() => setReason(r)}
                        className={`text-xs py-2 rounded-lg border ${reason === r ? "bg-[#B20605] text-white border-[#B20605]" : "bg-gray-50 border-gray-200"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <h3 className="font-semibold mb-2">Catatan & Foto (opsional)</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      placeholder="Jelaskan kondisi barang..."
                      className="w-full bg-gray-50 rounded-xl p-3 text-sm border border-gray-200" />
            <input type="file" accept="image/*" onChange={onPhotoChange} className="mt-2 text-sm" />
            {photo && <img src={photo} className="mt-2 rounded-lg" style={{maxWidth:200}} alt="bukti"/>}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-gray-100 px-4 py-3 z-40">
        <button onClick={submit} disabled={submitting || Object.keys(selectedItems).length === 0}
                className="w-full bg-[linear-gradient(136deg,rgba(254,159,159,1)_0%,rgba(178,6,5,1)_100%)] text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50">
          {submitting ? "Mengirim..." : "Kirim Pengajuan"}
        </button>
      </div>
    </div>
  );
}
