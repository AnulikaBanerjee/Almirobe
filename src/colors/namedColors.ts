/** Named wardrobe colours — used to keep the swatch and the written name in sync. */

export const NAMED_COLORS: { name: string; hex: string }[] = [
  { name: 'white', hex: '#f5f5f5' },
  { name: 'ivory', hex: '#f8f4ed' },
  { name: 'cream', hex: '#f5ecd7' },
  { name: 'beige', hex: '#d2c4a8' },
  { name: 'tan', hex: '#c8a982' },
  { name: 'khaki', hex: '#c3b091' },
  { name: 'brown', hex: '#8b5a2b' },
  { name: 'chocolate', hex: '#5c3317' },
  { name: 'black', hex: '#1a1a1a' },
  { name: 'charcoal', hex: '#3a3733' },
  { name: 'grey', hex: '#8a8a8a' },
  { name: 'navy', hex: '#1e3a5f' },
  { name: 'blue', hex: '#2b6cb0' },
  { name: 'sky blue', hex: '#7eb6d9' },
  { name: 'teal', hex: '#2a9d8f' },
  { name: 'green', hex: '#2f6b3a' },
  { name: 'olive', hex: '#7d7a4e' },
  { name: 'sage', hex: '#b2b88a' },
  { name: 'red', hex: '#b42318' },
  { name: 'maroon', hex: '#7a1f2b' },
  { name: 'burgundy', hex: '#5c1f2e' },
  { name: 'pink', hex: '#d4849a' },
  { name: 'blush', hex: '#decbc4' },
  { name: 'orange', hex: '#e07a2f' },
  { name: 'rust', hex: '#b85c38' },
  { name: 'mustard', hex: '#c9a227' },
  { name: 'yellow', hex: '#e2c44d' },
  { name: 'purple', hex: '#6b3fa0' },
  { name: 'gold', hex: '#d4af37' },
  { name: 'silver', hex: '#c0c0c0' },
  { name: 'pearl', hex: '#f0ead6' },
];

function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
}

export function titleCaseColor(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function hexForColorName(name: string): string | undefined {
  const key = name.trim().toLowerCase();
  if (!key) return undefined;
  const exact = NAMED_COLORS.find((c) => c.name === key);
  if (exact) return exact.hex;
  const compact = key.replace(/[\s-]/g, '');
  return NAMED_COLORS.find((c) => c.name.replace(/[\s-]/g, '') === compact)?.hex;
}

export function colorNameForHex(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  let best = NAMED_COLORS[0];
  let bestD = Infinity;
  for (const sample of NAMED_COLORS) {
    const s = parseHex(sample.hex);
    if (!s) continue;
    const d = (rgb[0] - s[0]) ** 2 + (rgb[1] - s[1]) ** 2 + (rgb[2] - s[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = sample;
    }
  }
  return titleCaseColor(best.name);
}
