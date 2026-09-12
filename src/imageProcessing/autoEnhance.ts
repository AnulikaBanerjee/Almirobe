/** Mild auto exposure + contrast on RGB canvas (run before background removal). */
export function autoEnhanceCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let sumL = 0;
  let minL = 255;
  let maxL = 0;
  const n = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sumL += l;
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;
  }

  const meanL = sumL / n;
  const targetMean = 132;
  const brightness = Math.min(1.35, Math.max(0.75, targetMean / Math.max(meanL, 1)));

  const range = Math.max(maxL - minL, 1);
  const contrast = Math.min(1.25, Math.max(0.9, 180 / range));

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let v = data[i + c];
      v = (v - 128) * contrast + 128;
      v = v * brightness;
      data[i + c] = Math.min(255, Math.max(0, Math.round(v)));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
