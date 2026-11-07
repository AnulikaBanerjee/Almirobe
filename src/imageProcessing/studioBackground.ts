const ALPHA_CUT = 18;

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function chroma(r: number, g: number, b: number): number {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

/**
 * Makes the flat studio backdrop (white paper, beige wall) transparent so
 * rotate/skew only move the garment. Border-connected and low-detail, so a
 * white shirt's wrinkles and outline are left alone.
 */
export function knockOutStudioBackground(source: HTMLCanvasElement): HTMLCanvasElement {
  const width = source.width;
  const height = source.height;
  const srcCtx = source.getContext('2d', { willReadFrequently: true });
  if (!srcCtx || width < 8 || height < 8) return source;

  const image = srcCtx.getImageData(0, 0, width, height);
  const data = image.data;
  const count = width * height;
  const lum = new Float32Array(count);
  const grad = new Float32Array(count);
  const isBg = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    const o = i * 4;
    if (data[o + 3] < ALPHA_CUT) {
      lum[i] = 255;
      continue;
    }
    lum[i] = luminance(data[o], data[o + 1], data[o + 2]);
  }

  const at = (x: number, y: number) => lum[y * width + x];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const xm = x > 0 ? x - 1 : x;
      const xp = x + 1 < width ? x + 1 : x;
      const ym = y > 0 ? y - 1 : y;
      const yp = y + 1 < height ? y + 1 : y;
      grad[y * width + x] = Math.hypot(at(xp, y) - at(xm, y), at(x, yp) - at(x, ym));
    }
  }

  const sampleCorner = (ox: number, oy: number) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let y = oy; y < oy + 10 && y < height; y++) {
      for (let x = ox; x < ox + 10 && x < width; x++) {
        const o = (y * width + x) * 4;
        if (data[o + 3] < ALPHA_CUT) continue;
        r += data[o];
        g += data[o + 1];
        b += data[o + 2];
        n++;
      }
    }
    if (!n) return [255, 255, 255] as const;
    return [r / n, g / n, b / n] as const;
  };

  const corners = [
    sampleCorner(0, 0),
    sampleCorner(Math.max(0, width - 10), 0),
    sampleCorner(0, Math.max(0, height - 10)),
    sampleCorner(Math.max(0, width - 10), Math.max(0, height - 10)),
  ];

  const nearCorner = (r: number, g: number, b: number) => {
    for (const [cr, cg, cb] of corners) {
      const d = Math.hypot(r - cr, g - cg, b - cb);
      if (d < 34) return true;
    }
    return false;
  };

  const canExpand = (index: number, fromLum: number, strict: boolean) => {
    const o = index * 4;
    if (data[o + 3] < ALPHA_CUT) return true;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const L = lum[index];
    const c = chroma(r, g, b);
    const flat = grad[index] < 42;
    const wall = nearCorner(r, g, b) && flat && Math.abs(L - fromLum) < 30;
    if (strict) {
      // Cross the studio wall, but only lift true blank paper — not cloth wrinkles.
      const paper = L >= 246 && c <= 16 && grad[index] < 28;
      return wall || paper;
    }
    const paper = L >= 228 && c <= 28 && grad[index] < 56;
    return paper || wall;
  };

  const qx = new Int32Array(count);
  const qy = new Int32Array(count);
  let head = 0;
  let tail = 0;
  const flood = (strict: boolean) => {
    isBg.fill(0);
    head = 0;
    tail = 0;
    const seed = (x: number, y: number) => {
      const index = y * width + x;
      if (isBg[index]) return;
      const o = index * 4;
      const alreadyClear = data[o + 3] < ALPHA_CUT;
      if (!alreadyClear && !canExpand(index, lum[index], strict)) return;
      isBg[index] = 1;
      qx[tail] = x;
      qy[tail] = y;
      tail++;
    };

    for (let x = 0; x < width; x++) {
      seed(x, 0);
      seed(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      seed(0, y);
      seed(width - 1, y);
    }

    while (head < tail) {
      const x = qx[head];
      const y = qy[head];
      head++;
      const from = lum[y * width + x];
      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = ny * width + nx;
        if (isBg[ni]) continue;
        if (!canExpand(ni, from, strict)) continue;
        isBg[ni] = 1;
        qx[tail] = nx;
        qy[tail] = ny;
        tail++;
      }
    }
  };

  const removedFraction = () => {
    let removed = 0;
    let opaque = 0;
    for (let i = 0; i < count; i++) {
      if (data[i * 4 + 3] >= ALPHA_CUT) opaque++;
      if (isBg[i] && data[i * 4 + 3] >= ALPHA_CUT) removed++;
    }
    return opaque === 0 ? 0 : removed / opaque;
  };

  flood(false);
  let fraction = removedFraction();
  if (fraction > 0.82) {
    flood(true);
    fraction = removedFraction();
  }

  // Nothing useful removed, or the garment itself was eaten.
  if (fraction < 0.04 || fraction > 0.82) return source;

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  const next = ctx.getImageData(0, 0, width, height);
  const pixels = next.data;
  for (let i = 0; i < count; i++) {
    if (!isBg[i]) continue;
    const o = i * 4;
    pixels[o + 3] = 0;
  }
  // Soften the cut so the garment edge does not pick up a hard white rim.
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (isBg[i]) continue;
      let bgNeighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (isBg[(y + dy) * width + (x + dx)]) bgNeighbors++;
        }
      }
      if (bgNeighbors >= 3) {
        const o = i * 4;
        pixels[o + 3] = Math.min(pixels[o + 3], 140);
      }
    }
  }
  ctx.putImageData(next, 0, 0);
  return out;
}
