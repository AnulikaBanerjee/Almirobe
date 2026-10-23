import { blobToDataUrl } from '@/imageProcessing/canvasUtils';
import type { ImageStorageProvider } from '@/images/types';

/** Turn a preview URL into a durable storage ref before saving an item. */
export async function persistImageUrl(
  storage: ImageStorageProvider,
  url: string | undefined
): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.startsWith('data:')) {
    const stored = await storage.upload(url);
    return stored.url;
  }
  if (url.startsWith('blob:')) {
    const blob = await fetch(url).then((response) => response.blob());
    const dataUrl = await blobToDataUrl(blob);
    const stored = await storage.upload(dataUrl);
    return stored.url;
  }
  return url;
}
