const PAD_RATIO = 0.08;
const BACKDROP = '#d4cfc4';
const ALPHA_MIN = 24;

function largestOpaqueBounds(canvas: HTMLCanvasElement) {
  const { width, height } = canvas;
  const maxScan = 360;
  const scale = Math.min(1, maxScan / Math.max(width, height));
  const sw = Math.max(1, Math.round(width * scale));
  const sh = Math.max(1, Math.round(height * scale));
  const scan = document.createElement('canvas');
  scan.width = sw;
  scan.height = sh;
  const sctx = scan.getContext('2d', { willReadFrequently: true });
  if (!sctx) return null;
  sctx.drawImage(canvas, 0, 0, sw, sh);
  const { data } = sctx.getImageData(0, 0, sw, sh);
  const visited = new Uint8Array(sw * sh);
  let best: { minX: number; minY: number; maxX: number; maxY: number; area: number } | null = null;
  const qx = new Int32Array(sw * sh);
  const qy = new Int32Array(sw * sh);

  for (let start = 0; start < sw * sh; start++) {
    if (visited[start] || data[start * 4 + 3] < ALPHA_MIN) continue;
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
          if (visited[ni] || data[ni * 4 + 3] < ALPHA_MIN) continue;
          visited[ni] = 1;
          qx[tail] = nx;
          qy[tail] = ny;
          tail++;
        }
      }
    }

    if (!best || area > best.area) best = { minX, minY, maxX, maxY, area };
  }

  if (!best) return null;
  if (best.area < sw * sh * 0.02) return null;
  const inv = 1 / scale;
  return {
    minX: Math.max(0, Math.floor(best.minX * inv)),
    minY: Math.max(0, Math.floor(best.minY * inv)),
    maxX: Math.min(width - 1, Math.ceil(best.maxX * inv)),
    maxY: Math.min(height - 1, Math.ceil(best.maxY * inv)),
    area: best.area,
  };
}

function drawGarmentWithShadow(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const piece = document.createElement('canvas');
  piece.width = sw;
  piece.height = sh;
  const pctx = piece.getContext('2d');
  if (!pctx) return;
  pctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);

  const blurGround = Math.max(14, dh * 0.09);
  const blurSide = Math.max(10, dh * 0.06);
  const cx = dx + dw / 2;
  const groundY = dy + dh + dh * 0.03;

  // Ground shadow beneath garment
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.filter = `blur(${blurGround}px)`;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, groundY, dw * 0.48, dh * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Left-side depth shadow
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.filter = `blur(${blurSide}px)`;
  ctx.drawImage(piece, dx - dw * 0.04, dy + dh * 0.02, dw, dh);
  ctx.restore();

  // Right-side depth shadow
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.filter = `blur(${blurSide * 0.85}px)`;
  ctx.drawImage(piece, dx + dw * 0.03, dy + dh * 0.015, dw, dh);
  ctx.restore();

  ctx.filter = 'none';

  // Contact shadow directly behind garment
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = Math.max(12, dh * 0.07);
  ctx.shadowOffsetX = Math.round(dw * 0.02);
  ctx.shadowOffsetY = Math.round(dh * 0.05);
  ctx.drawImage(piece, dx, dy, dw, dh);
  ctx.restore();

  // Crisp garment on top
  ctx.drawImage(piece, dx, dy, dw, dh);
}

/** Trim transparent padding, add shadows, place on a soft wardrobe backdrop. */
export function compositeForWardrobe(
  canvas: HTMLCanvasElement,
  transparent = false
): HTMLCanvasElement {
  const bounds = largestOpaqueBounds(canvas);
  if (!bounds) return canvas;

  const cropW = bounds.maxX - bounds.minX + 1;
  const cropH = bounds.maxY - bounds.minY + 1;
  const padX = Math.round(cropW * PAD_RATIO);
  const padY = Math.round(cropH * PAD_RATIO);
  const outW = cropW + padX * 2;
  const outH = cropH + padY * 2;

  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext('2d');
  if (!ctx) return canvas;

  if (!transparent) {
    const grad = ctx.createLinearGradient(0, 0, 0, outH);
    grad.addColorStop(0, '#ddd8d0');
    grad.addColorStop(1, BACKDROP);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, outW, outH);
  }

  drawGarmentWithShadow(
    ctx,
    canvas,
    bounds.minX,
    bounds.minY,
    cropW,
    cropH,
    padX,
    padY,
    cropW,
    cropH
  );

  return out;
}
