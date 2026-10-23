const ALPHA_MIN = 24;
const BACKDROP_MAX_DIST = 28;

export interface OpaqueRegion {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  area: number;
}

function isGarmentPixel(data: Uint8ClampedArray, i: number): boolean {
  const a = data[i + 3];
  if (a < ALPHA_MIN) return false;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const dist = Math.abs(r - 212) + Math.abs(g - 207) + Math.abs(b - 196);
  if (a > 250 && dist < BACKDROP_MAX_DIST) return false;
  return true;
}

/** Connected opaque regions, largest first. */
export function findOpaqueRegions(canvas: HTMLCanvasElement, minAreaRatio = 0.015): OpaqueRegion[] {
  const { width, height } = canvas;
  const maxScan = 360;
  const scale = Math.min(1, maxScan / Math.max(width, height));
  const sw = Math.max(1, Math.round(width * scale));
  const sh = Math.max(1, Math.round(height * scale));
  const scan = document.createElement('canvas');
  scan.width = sw;
  scan.height = sh;
  const sctx = scan.getContext('2d', { willReadFrequently: true });
  if (!sctx) return [];
  sctx.drawImage(canvas, 0, 0, sw, sh);
  const { data } = sctx.getImageData(0, 0, sw, sh);
  const visited = new Uint8Array(sw * sh);
  const qx = new Int32Array(sw * sh);
  const qy = new Int32Array(sw * sh);
  const regions: OpaqueRegion[] = [];
  const inv = 1 / scale;

  for (let start = 0; start < sw * sh; start++) {
    if (visited[start] || !isGarmentPixel(data, start * 4)) continue;
    const sx0 = start % sw;
    const sy0 = (start / sw) | 0;
    let head = 0;
    let tail = 0;
    qx[tail] = sx0;
    qy[tail] = sy0;
    tail++;
    visited[start] = 1;
    let minX = sx0;
    let minY = sy0;
    let maxX = sx0;
    let maxY = sy0;
    let area = 0;

    while (head < tail) {
      const x = qx[head];
      const y = qy[head];
      head++;
      area++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= sw || ny >= sh) continue;
          const ni = ny * sw + nx;
          if (visited[ni] || !isGarmentPixel(data, ni * 4)) continue;
          visited[ni] = 1;
          qx[tail] = nx;
          qy[tail] = ny;
          tail++;
        }
      }
    }

    if (area < sw * sh * minAreaRatio) continue;
    regions.push({
      minX: Math.max(0, Math.floor(minX * inv)),
      minY: Math.max(0, Math.floor(minY * inv)),
      maxX: Math.min(width - 1, Math.ceil(maxX * inv)),
      maxY: Math.min(height - 1, Math.ceil(maxY * inv)),
      area,
    });
  }

  regions.sort((a, b) => b.area - a.area);
  return regions;
}

function occupancySegments(profile: Float32Array, minFrac = 0.06): number {
  const n = profile.length;
  if (n < 8) return 0;
  const k = Math.max(3, Math.floor(n / 40));
  const smooth = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let c = 0;
    for (let j = i - k; j <= i + k; j++) {
      if (j < 0 || j >= n) continue;
      sum += profile[j];
      c++;
    }
    smooth[i] = sum / c;
  }
  let max = 0;
  for (let i = 0; i < n; i++) if (smooth[i] > max) max = smooth[i];
  if (max < 1) return 0;
  const thresh = max * 0.18;
  const minLen = Math.max(3, n * minFrac);
  let segments = 0;
  let run = 0;
  for (let i = 0; i < n; i++) {
    if (smooth[i] > thresh) {
      run++;
    } else if (run > 0) {
      if (run >= minLen) segments++;
      run = 0;
    }
  }
  if (run >= minLen) segments++;
  return segments;
}

function occupancyLooksSplit(canvas: HTMLCanvasElement): boolean {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;
  const maxScan = 280;
  const scale = Math.min(1, maxScan / Math.max(width, height));
  const sw = Math.max(1, Math.round(width * scale));
  const sh = Math.max(1, Math.round(height * scale));
  const scan = document.createElement('canvas');
  scan.width = sw;
  scan.height = sh;
  const sctx = scan.getContext('2d', { willReadFrequently: true });
  if (!sctx) return false;
  sctx.drawImage(canvas, 0, 0, sw, sh);
  const { data } = sctx.getImageData(0, 0, sw, sh);
  const cols = new Float32Array(sw);
  const rows = new Float32Array(sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (!isGarmentPixel(data, (y * sw + x) * 4)) continue;
      cols[x] += 1;
      rows[y] += 1;
    }
  }
  return occupancySegments(cols) >= 2 || occupancySegments(rows) >= 2;
}

export function trimOpaqueUnion(canvas: HTMLCanvasElement, padRatio = 0.04): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isGarmentPixel(data, (y * width + x) * 4)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return canvas;
  const padX = Math.round((maxX - minX + 1) * padRatio);
  const padY = Math.round((maxY - minY + 1) * padRatio);
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(width - 1, maxX + padX);
  maxY = Math.min(height - 1, maxY + padY);
  const out = document.createElement('canvas');
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  const octx = out.getContext('2d');
  if (!octx) return canvas;
  octx.drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

export function looksLikeMultipleGarments(canvas: HTMLCanvasElement): boolean {
  const regions = findOpaqueRegions(canvas);
  if (regions.length >= 2) {
    const second = regions[1].area;
    const first = regions[0].area;
    if (second >= first * 0.22) return true;
  }
  return occupancyLooksSplit(canvas);
}

export async function canvasFromImageUrl(url: string): Promise<HTMLCanvasElement> {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not inspect image');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  return canvas;
}
