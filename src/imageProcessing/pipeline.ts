import { autoEnhanceCanvas } from '@/imageProcessing/autoEnhance';
import { compositeForWardrobe } from '@/imageProcessing/composite';
import {
  bitmapToCanvas,
  canvasToDataUrl,
  loadBitmapFromFile,
} from '@/imageProcessing/canvasUtils';
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
}

export interface PipelineOptions {
  onProgress?: (stage: PipelineStage, message: string, ratio?: number) => void;
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
    cutout = await removeBackgroundToCanvas(canvas, (p: ProcessingProgress) => {
      onProgress?.('background', p.message, p.ratio);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not remove background';
    throw new Error(message);
  }

  onProgress?.('composite', 'Finishing…');
  const processedCanvas = compositeForWardrobe(cutout, false);
  const processedDataUrl = await canvasToDataUrl(processedCanvas, 'image/png', 0.92);

  onProgress?.('done', 'Ready');

  return {
    originalDataUrl,
    processedDataUrl,
    processedCanvas,
  };
}
