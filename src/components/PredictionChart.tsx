import React, { useState, useMemo } from "react";

type ChartDataPoint = { bulan: string; ton: number };

type PredictionChartProps = {
  data: ChartDataPoint[];
  kecamatanNama: string;
};

export const PredictionChart: React.FC<PredictionChartProps> = ({ data, kecamatanNama }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const W = 720;
  const H = 320;
  const PAD = { top: 28, right: 28, bottom: 54, left: 64 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const { minY, maxY, points, pathD, areaD } = useMemo(() => {
    if (!data.length) return { minY: 0, maxY: 100, points: [], pathD: "", areaD: "" };
    const vals = data.map((d) => d.ton);
    const rawMin = Math.min(...vals);
    const rawMax = Math.max(...vals);
    const padding = Math.max((rawMax - rawMin) * 0.15, 50);
    const minY = Math.max(0, rawMin - padding);
    const maxY = rawMax + padding;

    const pts = data.map((d, i) => ({
      x: PAD.left + (i / Math.max(1, data.length - 1)) * plotW,
      y: PAD.top + plotH - ((d.ton - minY) / Math.max(1, maxY - minY)) * plotH,
      ...d
    }));

    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaD = pathD + ` L ${pts[pts.length - 1].x} ${PAD.top + plotH} L ${pts[0].x} ${PAD.top + plotH} Z`;

    return { minY, maxY, points: pts, pathD, areaD };
  }, [data]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const count = 5;
    const step = (maxY - minY) / count;
    return Array.from({ length: count + 1 }, (_, i) => {
      const val = minY + step * i;
      return {
        val,
        y: PAD.top + plotH - ((val - minY) / Math.max(1, maxY - minY)) * plotH,
        label: val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)
      };
    });
  }, [minY, maxY]);

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 text-[13px]">
        <div className="text-[32px] mb-2">📊</div>
        Klik wilayah kecamatan pada peta untuk melihat grafik prediksi 12 bulan.
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-emerald-900/10 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <div className="font-[700] text-emerald-950">
          Prediksi Panen 12 Bulan — {kecamatanNama}
        </div>
        <div className="text-[11.5px] text-slate-500 mt-0.5">
          Rolling forecast menggunakan model LSTM • {data.length} bulan ke depan
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full max-w-[720px] mx-auto"
          style={{ minWidth: 480 }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Gradient fill */}
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={PAD.left} y1={t.y}
                x2={W - PAD.right} y2={t.y}
                stroke="#e2e8f0" strokeWidth={1}
                strokeDasharray={i === 0 ? "" : "4 3"}
              />
              <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fill="#94a3b8" fontSize={10} fontWeight={500}>
                {t.label}
              </text>
            </g>
          ))}

          {/* Y-axis label */}
          <text
            x={14} y={PAD.top + plotH / 2}
            textAnchor="middle" fill="#64748b" fontSize={10} fontWeight={600}
            transform={`rotate(-90, 14, ${PAD.top + plotH / 2})`}
          >
            Produksi (ton)
          </text>

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#chartGrad)" />}

          {/* Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#059669"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
            />
          )}

          {/* Data points + X labels */}
          {points.map((p, i) => (
            <g key={i}>
              {/* X-axis label */}
              <text
                x={p.x} y={H - 12}
                textAnchor="middle" fill="#94a3b8"
                fontSize={9} fontWeight={500}
                transform={`rotate(-35, ${p.x}, ${H - 12})`}
              >
                {p.bulan}
              </text>

              {/* Invisible hover area */}
              <rect
                x={p.x - 18} y={PAD.top}
                width={36} height={plotH}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                style={{ cursor: "crosshair" }}
              />

              {/* Circle point */}
              <circle
                cx={p.x} cy={p.y} r={hoveredIndex === i ? 6 : 4}
                fill={hoveredIndex === i ? "#047857" : "#059669"}
                stroke="white" strokeWidth={2}
                className="transition-all duration-150"
              />

              {/* Hover vertical line */}
              {hoveredIndex === i && (
                <line
                  x1={p.x} y1={PAD.top}
                  x2={p.x} y2={PAD.top + plotH}
                  stroke="#059669" strokeWidth={1} strokeDasharray="4 3" opacity={0.5}
                />
              )}
            </g>
          ))}
        </svg>

        {/* Tooltip — rendered outside SVG for better styling */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="relative mx-auto max-w-[720px]"
            style={{ minWidth: 480 }}
          >
            <div
              className="absolute -top-[70px] px-3 py-2 rounded-xl bg-slate-900 text-white text-[12px] shadow-lg z-10 pointer-events-none whitespace-nowrap"
              style={{
                left: `${(points[hoveredIndex].x / W) * 100}%`,
                transform: "translateX(-50%)"
              }}
            >
              <div className="font-[700]">{points[hoveredIndex].bulan}</div>
              <div className="text-emerald-300 font-[600]">
                {points[hoveredIndex].ton.toLocaleString("id-ID")} ton
              </div>
              <div className="absolute left-1/2 -bottom-[5px] -translate-x-1/2 w-[10px] h-[10px] bg-slate-900 rotate-45" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
