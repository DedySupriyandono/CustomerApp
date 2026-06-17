import { useEffect, useState } from "react";
import bannerImg from "../assets/banner.png";

// Slider banner Home. Fetch list dari API (filter by audience+window di backend).
// Auto-rotate setiap 5s. Kalau API kosong/gagal → fallback ke banner statis.
//
// Props:
//   - apiClient: instance axios (api / salesApi)
//   - urlPrefix: "/customer" atau "/sales"
//
export default function HomeSlider({ apiClient, urlPrefix = "/customer" }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .get(`${urlPrefix}/sliders`)
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, [apiClient, urlPrefix]);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setActive((p) => (p + 1) % items.length);
    }, 5000);
    return () => clearInterval(t);
  }, [items.length]);

  // Belum load / kosong → fallback ke banner statis (1 slide).
  const slides = loaded && items.length > 0 ? items : [{ id: "fallback", fallback: true }];
  const current = slides[active] || slides[0];

  const renderImage = (s) => {
    if (s.fallback) {
      return <img src={bannerImg} alt="" className="w-full h-full object-cover" />;
    }
    const src = s.imageBase64
      ? `data:${s.contentType || "image/png"};base64,${s.imageBase64}`
      : bannerImg;
    const content = (
      <>
        <img src={src} alt={s.title || ""} className="w-full h-full object-cover" />
        {(s.title || s.subtitle) && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent flex flex-col justify-end p-4">
            {s.title && (
              <div className="text-white font-bold text-[15px] leading-tight drop-shadow">
                {s.title}
              </div>
            )}
            {s.subtitle && (
              <div className="text-white/85 text-[11px] mt-1 line-clamp-2 drop-shadow">
                {s.subtitle}
              </div>
            )}
          </div>
        )}
      </>
    );
    return s.linkUrl ? (
      <a href={s.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
        {content}
      </a>
    ) : (
      content
    );
  };

  return (
    <div className="mt-5 px-5">
      <div className="relative rounded-xl overflow-hidden aspect-[358/146] shadow-sm">
        {renderImage(current)}
      </div>
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {slides.map((s, i) => (
            <button
              key={s.id}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-4 bg-[#B20605]" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
