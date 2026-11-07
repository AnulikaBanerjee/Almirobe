import { compositeForWardrobe } from '@/imageProcessing/composite';
import { canvasToDataUrl } from '@/imageProcessing/canvasUtils';

export interface CropNorm {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function transformSource(
  source: HTMLCanvasElement,
  rotationDeg: number,
  skewXDeg: number,
  skewYDeg: number
): HTMLCanvasElement {
  const rad = (rotationDeg * Math.PI) / 180;
  const tx = Math.tan((skewXDeg * Math.PI) / 180);
  const ty = Math.tan((skewYDeg * Math.PI) / 180);
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  const w = source.width;
  const h = source.height;

  const corners = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ].map(([x, y]) => {
    const sx = x + tx * y;
    const sy = y + ty * x;
    const cx = sx - w / 2;
    const cy = sy - h / 2;
    return [cx * cos - cy * sin, cx * sin + cy * cos];
  });

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of corners) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const outW = Math.max(1, Math.ceil(maxX - minX));
  const outH = Math.max(1, Math.ceil(maxY - minY));
  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext('2d');
  if (!ctx) return source;
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate(rad);
  ctx.transform(1, ty, tx, 1, 0, 0);
  ctx.drawImage(source, -w / 2, -h / 2);
  return out;
}

export function cropCanvas(source: HTMLCanvasElement, crop: CropNorm): HTMLCanvasElement {
  const sx = Math.round(crop.x * source.width);
  const sy = Math.round(crop.y * source.height);
  const sw = Math.max(1, Math.round(crop.w * source.width));
  const sh = Math.max(1, Math.round(crop.h * source.height));
  const out = document.createElement('canvas');
  out.width = sw;
  out.height = sh;
  const ctx = out.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return out;
}

export async function exportGarmentSelection(
  source: HTMLCanvasElement,
  crop: CropNorm,
  rotationDeg: number,
  skewXDeg: number,
  skewYDeg: number
): Promise<string> {
  const transformed = transformSource(source, rotationDeg, skewXDeg, skewYDeg);
  const cropped = cropCanvas(transformed, crop);
  const finished = compositeForWardrobe(cropped, false);
  return canvasToDataUrl(finished, 'image/png', 0.92);
}
