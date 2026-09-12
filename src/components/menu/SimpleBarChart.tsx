import type { ChartSlice } from '@/reports/purchaseReport';
import { formatCurrency } from '@/reports/purchaseReport';

interface SimpleBarChartProps {
  slices: ChartSlice[];
}

export default function SimpleBarChart({ slices }: SimpleBarChartProps) {
  const max = Math.max(...slices.map((s) => s.value), 1);
  if (slices.length === 0) {
    return <p className="text-xs text-ink-500 text-center py-4">Add purchase dates to see monthly spend.</p>;
  }

  return (
    <div className="space-y-2">
      {slices.map((slice) => (
        <div key={slice.label}>
          <div className="flex justify-between text-[10px] text-ink-500 mb-0.5">
            <span>{slice.label}</span>
            <span>{formatCurrency(slice.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-900/80 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(slice.value / max) * 100}%`, backgroundColor: slice.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
