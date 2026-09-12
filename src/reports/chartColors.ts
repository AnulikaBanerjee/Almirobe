export const CHART_COLORS = [
  '#e8b86d',
  '#7eb8da',
  '#c97b9a',
  '#8bc9a0',
  '#a78bfa',
  '#f97316',
  '#38bdf8',
  '#f472b6',
  '#34d399',
  '#fbbf24',
];

export function colorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
