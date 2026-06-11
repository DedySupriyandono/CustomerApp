import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck, Inbox } from "lucide-react";
import salesApi from "../../api/salesApi";
import { useSalesNotifications } from "../../contexts/NotificationContext";

export default function SalesNotifications() {
  const navigate = useNavigate();
  const { refetch } = useSalesNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await salesApi.get("/sales/notifications", { params: { pageSize: 50 } });
      setItems(data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = async (n) => {
    if (n.status === "unread") {
      try {
        await salesApi.post(`/sales/notifications/${n.id}/read`);
        refetch();
      } catch (_) {}
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      await salesApi.post("/sales/notifications/read-all");
      load();
      refetch();
    } catch (_) {}
  };

  return (
    <div
      className="mobile-container relative shadow-2xl pb-10"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[150px] bg-gradient-to-b from-[#1A0000] via-[#350000] to-[#540101] z-0" />

      <div className="relative z-10">
        <header className="flex items-center justify-between px-5 pt-12 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-base font-bold">Notifikasi</h1>
          </div>
          <button
            onClick={markAll}
            className="text-white/90 text-[11px] font-semibold flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-full"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Tandai semua
          </button>
        </header>

        <section className="bg-[#FBF9F9] rounded-t-[20px] -mt-2 min-h-[calc(100vh-150px)] px-5 pt-[18px]">
          {loading && (
            <div className="text-center text-gray-400 py-12 text-sm">Memuat notifikasi...</div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-center text-gray-400 py-16 text-sm">
              <Inbox className="w-12 h-12 mx-auto mb-2 opacity-40" />
              Tidak ada notifikasi
            </div>
          )}

          <div className="space-y-2">
            {!loading &&
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className={`w-full text-left rounded-2xl p-4 flex gap-3 border ${
                    n.status === "unread"
                      ? "bg-[#FFF5F5] border-[#FECECE]"
                      : "bg-white border-[#F6F3F3]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#B20605] text-white flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-[14px] text-[#1A0000] truncate flex-1">
                        {n.title}
                      </div>
                      {n.status === "unread" && (
                        <span className="w-2 h-2 rounded-full bg-[#B20605] shrink-0" />
                      )}
                    </div>
                    {n.body && <div className="text-[12px] text-[#606060] mt-0.5">{n.body}</div>}
                    <div className="text-[10px] text-gray-400 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString("id-ID") : ""}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
