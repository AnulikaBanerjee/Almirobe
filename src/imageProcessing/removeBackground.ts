import { removeBackground, type Config } from '@imgly/background-removal';
import { blobToCanvas } from '@/imageProcessing/canvasUtils';

export type ProcessingProgress = {
  stage: 'model' | 'infer' | 'done';
  message: string;
  ratio?: number;
};

let removalProgressCallback: ((p: ProcessingProgress) => void) | null = null;

function baseConfig(device: Config['device']): Config {
  return {
    model: 'isnet_fp16',
    device,
    output: {
      format: 'image/png',
      quality: 0.92,
    },
    progress: (key, current, total) => {
      removalProgressCallback?.({
        stage: key.includes('fetch') || key.includes('compute') ? 'model' : 'infer',
        message: key.includes('fetch')
          ? 'Downloading AI model (first time only)…'
          : 'Removing background…',
        ratio: total > 0 ? current / total : undefined,
      });
    },
  };
}

export async function removeBackgroundToCanvas(
  source: HTMLCanvasElement | Blob | string,
  onProgress?: (p: ProcessingProgress) => void
): Promise<HTMLCanvasElement> {
  removalProgressCallback = onProgress ?? null;
  try {
    onProgress?.({ stage: 'infer', message: 'Removing background…' });
    const input =
      source instanceof HTMLCanvasElement
        ? await new Promise<Blob>((resolve, reject) => {
            source.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), 'image/png');
          })
        : source;

    let blob: Blob;
    try {
      blob = await removeBackground(input, baseConfig('gpu'));
    } catch {
      blob = await removeBackground(input, baseConfig('cpu'));
    }
    onProgress?.({ stage: 'done', message: 'Done' });
    return blobToCanvas(blob);
  } finally {
    removalProgressCallback = null;
  }
}
