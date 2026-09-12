import type { ChartSlice } from '@/reports/purchaseReport';

interface SimplePieChartProps {
  slices: ChartSlice[];
  size?: number;
  valuePrefix?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const startPt = polarToCartesian(cx, cy, r, end);
  const endPt = polarToCartesian(cx, cy, r, start);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${large} 0 ${endPt.x} ${endPt.y} Z`;
}

export default function SimplePieChart({ slices, size = 140, valuePrefix = '' }: SimplePieChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) {
    return (
      <p className="text-xs text-ink-500 text-center py-6">No data yet — add purchase prices on your items.</p>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  let angle = 0;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <svg width={size} height={size} className="flex-shrink-0">
        {slices.map((slice) => {
          const sliceAngle = (slice.value / total) * Math.PI * 2;
          const path = arcPath(cx, cy, r, angle, angle + sliceAngle);
          angle += sliceAngle;
          return <path key={slice.label} d={path} fill={slice.color} stroke="#1a1a1f" strokeWidth={1} />;
        })}
        <circle cx={cx} cy={cy} r={r * 0.45} fill="#1a1a1f" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-ink-200 text-[10px]">
          {valuePrefix}{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
        </text>
      </svg>
      <ul className="flex-1 space-y-1.5 min-w-0">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
            <span className="text-ink-300 truncate flex-1">{slice.label}</span>
            <span className="text-ink-500 tabular-nums">
              {valuePrefix}{slice.value}
              <span className="text-ink-600 ml-1">({Math.round((slice.value / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
