// Lightweight inline-SVG charts buat owner portal. Tidak pakai library
// (recharts/chart.js) supaya bundle tetap kecil. Mockup-nya simple — line,
// bar, donut — masing-masing < 40 line SVG.

// LineChart — area + line, dipakai utk Weekly Revenue Trend.
export function LineChart({ points = [], color = "#1E1B4B", height = 180 }) {
  const w = 320, h = height, pad = 24;
  const max = Math.max(1, ...points.map((p) => Number(p.value) || 0));
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (Number(p.value) / max) * (h - pad * 2);
    return [x, y];
  });
  const polyline = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPath =
    coords.length > 0
      ? `M${pad},${h - pad} L${polyline.split(" ").join(" L")} L${w - pad},${h - pad} Z`
      : "";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      {/* grid 4 baris */}
      {[0, 1, 2, 3].map((i) => {
        const y = pad + ((h - pad * 2) / 3) * i;
        return <line key={i} x1={pad} y1={y} x2={w - pad} y2={y} stroke="#E5E7EB" strokeDasharray="3,4" />;
      })}
      {/* area */}
      {areaPath && <path d={areaPath} fill={color} opacity="0.08" />}
      {/* line */}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* labels */}
      {points.map((p, i) => {
        const x = pad + i * stepX;
        return (
          <text key={i} x={x} y={h - 6} textAnchor="middle" fontSize="11" fill="#9CA3AF">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}

// BarChart — bar vertical, dipakai utk Weekly Return Trend.
export function BarChart({ points = [], color = "#EF4444", height = 200 }) {
  const w = 320, h = height, pad = 28;
  const max = Math.max(1, ...points.map((p) => Number(p.value) || 0));
  const barW = (w - pad * 2) / (points.length || 1) * 0.4;
  const stepX = points.length > 0 ? (w - pad * 2) / points.length : 0;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      {[0, 1, 2, 3].map((i) => {
        const y = pad + ((h - pad * 2) / 3) * i;
        return <line key={i} x1={pad} y1={y} x2={w - pad} y2={y} stroke="#E5E7EB" strokeDasharray="3,4" />;
      })}
      {points.map((p, i) => {
        const v = Number(p.value) || 0;
        const barH = (v / max) * (h - pad * 2);
        const x = pad + i * stepX + (stepX - barW) / 2;
        const y = h - pad - barH;
        return <rect key={i} x={x} y={y} width={barW} height={barH} rx="4" fill={color} />;
      })}
      {points.map((p, i) => {
        const x = pad + i * stepX + stepX / 2;
        return (
          <text key={i} x={x} y={h - 6} textAnchor="middle" fontSize="11" fill="#9CA3AF">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}

// DonutChart — donut + legend list di samping (mockup Return Reasons).
// items: [{label, value, color}]
export function DonutChart({ items = [], size = 130, thickness = 22 }) {
  const total = items.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - thickness / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {/* background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={thickness} />
      {items.map((it, i) => {
        const v = Number(it.value) || 0;
        if (total <= 0) return null;
        const len = (v / total) * circumference;
        const dash = `${len} ${circumference - len}`;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={it.color}
            strokeWidth={thickness}
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}
