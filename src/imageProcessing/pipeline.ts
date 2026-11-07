import { autoEnhanceCanvas } from '@/imageProcessing/autoEnhance';
import { compositeForWardrobe } from '@/imageProcessing/composite';
import {
  bitmapToCanvas,
  canvasToDataUrl,
  loadBitmapFromFile,
} from '@/imageProcessing/canvasUtils';
import { looksLikeMultipleGarments, trimOpaqueUnion } from '@/imageProcessing/regions';
import { removeBackgroundToCanvas, type ProcessingProgress } from '@/imageProcessing/removeBackground';

export type PipelineStage =
  | 'loading'
  | 'enhance'
  | 'background'
  | 'composite'
  | 'done'
  | 'error';

export interface PipelineResult {
  originalDataUrl: string;
  processedDataUrl: string;
  processedCanvas: HTMLCanvasElement;
  needsCrop: boolean;
}

export interface PipelineOptions {
  onProgress?: (stage: PipelineStage, message: string, ratio?: number) => void;
}

function opaqueCount(canvas: HTMLCanvasElement, threshold = 24): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let n = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= threshold) n++;
  }
  return n;
}

function nonWhiteCount(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.max(data[i], data[i + 1], data[i + 2]) < 245) n++;
  }
  return n;
}

function cutoutLooksIntact(original: HTMLCanvasElement, cutout: HTMLCanvasElement): boolean {
  const opaque = opaqueCount(cutout);
  const pixels = cutout.width * cutout.height;
  if (opaque < pixels * 0.04) return false;
  const garment = nonWhiteCount(original);
  if (garment > 0 && opaque < garment * 0.25) return false;
  const aspect = cutout.height / Math.max(cutout.width, 1);
  const origAspect = original.height / Math.max(original.width, 1);
  if (aspect > origAspect * 2.2) return false;
  return true;
}

export async function runClothingImagePipeline(
  source: File | HTMLCanvasElement,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const { onProgress } = options;

  onProgress?.('loading', 'Loading photo…');
  let canvas: HTMLCanvasElement;
  if (source instanceof HTMLCanvasElement) {
    canvas = source;
  } else {
    const bitmap = await loadBitmapFromFile(source);
    canvas = bitmapToCanvas(bitmap);
  }
  const originalDataUrl = canvas.toDataURL('image/jpeg', 0.85);

  onProgress?.('enhance', 'Improving brightness…');
  canvas = autoEnhanceCanvas(canvas);

  onProgress?.('background', 'Removing background…');
  let cutout = canvas;
  try {
    const removed = await removeBackgroundToCanvas(canvas, (p: ProcessingProgress) => {
      onProgress?.('background', p.message, p.ratio);
    });
    cutout = cutoutLooksIntact(canvas, removed) ? removed : canvas;
  } catch {
    cutout = canvas;
  }

  const needsCrop = looksLikeMultipleGarments(cutout);
  onProgress?.('composite', needsCrop ? 'Keeping all garments for crop…' : 'Finishing…');
  const processedCanvas = needsCrop ? trimOpaqueUnion(cutout) : compositeForWardrobe(cutout, false);
  const processedDataUrl = await canvasToDataUrl(processedCanvas, 'image/png', 0.92);

  onProgress?.('done', 'Ready');

  return {
    originalDataUrl,
    processedDataUrl,
    processedCanvas,
    needsCrop,
  };
}
