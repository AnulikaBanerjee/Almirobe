import { normalizeWardrobeData } from '@/storage/normalize';
import type { WardrobeData, WardrobeStorageProvider } from '@/storage/types';

const STORAGE_KEY = 'my-wardrobe-data-v1';

function isWardrobeData(value: unknown): value is WardrobeData {
  if (!value || typeof value !== 'object') return false;
  const data = value as WardrobeData;
  return (
    Array.isArray(data.collections) &&
    Array.isArray(data.items) &&
    Array.isArray(data.looks) &&
    typeof data.activeCollectionId === 'string'
  );
}

export class LocalStorageProvider implements WardrobeStorageProvider {
  readonly id = 'local';

  async load(): Promise<WardrobeData | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed: unknown = JSON.parse(raw);
      if (!isWardrobeData(parsed)) return null;

      return normalizeWardrobeData(parsed);
    } catch {
      return null;
    }
  }

  async save(data: WardrobeData): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /** Useful for tests or a future "reset wardrobe" action. */
  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }
}
