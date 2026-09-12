const PAD_RATIO = 0.08;
const BACKDROP = '#d4cfc4';

function alphaBounds(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 24) continue;
      found = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!found) return null;
  return { minX, minY, maxX, maxY };
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
  const bounds = alphaBounds(canvas);
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
