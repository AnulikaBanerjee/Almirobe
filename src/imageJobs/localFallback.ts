import { runClothingImagePipeline } from '@/imageProcessing/pipeline';
import type { ImageTags } from '@/imageJobs/tags';

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function colorName(r: number, g: number, b: number): string {
  const palette: Array<[number, number, number, string]> = [
    [255, 255, 255, 'white'],
    [0, 0, 0, 'black'],
    [20, 50, 120, 'navy'],
    [40, 90, 200, 'blue'],
    [180, 40, 40, 'red'],
    [20, 120, 70, 'green'],
    [200, 180, 130, 'beige'],
    [140, 90, 50, 'brown'],
    [180, 78, 28, 'rust'],
    [230, 110, 35, 'orange'],
    [180, 180, 180, 'grey'],
  ];
  let best = 'unknown';
  let bestD = Infinity;
  for (const [pr, pg, pb, name] of palette) {
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}

export async function localQuickTags(file: File): Promise<ImageTags> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return {};
  ctx.drawImage(bitmap, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.max(data[i], data[i + 1], data[i + 2]) >= 245) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  }
  if (n === 0) return {};
  r = Math.round(r / n);
  g = Math.round(g / n);
  b = Math.round(b / n);
  const name = colorName(r, g, b);
  return {
    color: { value: name, confidence: 0.7 },
    colorHex: rgbToHex(r, g, b),
    suggestedName: `${name} item`,
  };
}

export async function localCutout(file: File): Promise<{ url: string; needsCrop: boolean }> {
  const result = await runClothingImagePipeline(file);
  return { url: result.processedDataUrl, needsCrop: result.needsCrop };
}
