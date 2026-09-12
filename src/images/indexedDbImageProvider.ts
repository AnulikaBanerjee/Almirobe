import type { ImageStorageProvider, StoredImage } from '@/images/types';

const DB_NAME = 'my-wardrobe-images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

export class IndexedDbImageProvider implements ImageStorageProvider {
  readonly id = 'indexeddb';

  async upload(dataUrl: string): Promise<StoredImage> {
    const id = `idb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const blob = dataUrlToBlob(dataUrl);
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return { id, url: `indexeddb://${id}` };
  }

  async resolveUrl(ref: string): Promise<string | null> {
    const id = ref.startsWith('indexeddb://') ? ref.slice('indexeddb://'.length) : ref;
    const db = await openDb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }
}
