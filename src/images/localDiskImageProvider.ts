import { IndexedDbImageProvider } from '@/images/indexedDbImageProvider';
import type { ImageStorageProvider, StoredImage } from '@/images/types';

/**
 * Saves photos to data/uploads/ via the Vite dev middleware.
 * Falls back to IndexedDB if the API is unavailable (wrong port / old server).
 */
export class LocalDiskImageProvider implements ImageStorageProvider {
  readonly id = 'local-disk';
  private fallback = new IndexedDbImageProvider();

  async upload(dataUrl: string): Promise<StoredImage> {
    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataUrl }),
      });
      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }
      return (await response.json()) as StoredImage;
    } catch (error) {
      console.warn('Local disk image upload failed, using IndexedDB fallback:', error);
      return this.fallback.upload(dataUrl);
    }
  }

  async resolveUrl(ref: string): Promise<string | null> {
    if (ref.startsWith('/uploads/')) return ref;
    if (ref.startsWith('http')) return ref;
    if (ref.startsWith('indexeddb://')) {
      return this.fallback.resolveUrl(ref);
    }
    return this.fallback.resolveUrl(ref);
  }
}
