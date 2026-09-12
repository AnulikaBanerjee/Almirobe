const MAX_EDGE = 1280;

export async function loadBitmapFromFile(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return await createImageBitmap(file);
  }
}

export function bitmapToCanvas(bitmap: ImageBitmap, maxEdge = MAX_EDGE): HTMLCanvasElement {
  let { width, height } = bitmap;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create canvas');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not export image'));
    }, type, quality);
  });
}

export async function canvasToDataUrl(canvas: HTMLCanvasElement, type = 'image/png', quality = 0.92): Promise<string> {
  const blob = await canvasToBlob(canvas, type, quality);
  return await blobToDataUrl(blob);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(blob);
  return bitmapToCanvas(bitmap, MAX_EDGE);
}

export function rotateCanvas(source: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  if (degrees === 0) return source;
  const rad = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const w = source.width;
  const h = source.height;
  const outW = Math.round(w * cos + h * sin);
  const outH = Math.round(w * sin + h * cos);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas');
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate(rad);
  ctx.drawImage(source, -w / 2, -h / 2);
  return canvas;
}
