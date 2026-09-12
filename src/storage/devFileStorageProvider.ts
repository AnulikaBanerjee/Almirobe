import { normalizeWardrobeData } from '@/storage/normalize';
import type { WardrobeData, WardrobeStorageProvider } from '@/storage/types';

function storageKey(profileId: string): string {
  return `my-wardrobe-data-v1-${profileId}`;
}

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

/**
 * Dev persistence: writes wardrobe JSON to data/wardrobe-data-<profile>.json via Vite middleware.
 */
export class DevFileStorageProvider implements WardrobeStorageProvider {
  readonly id = 'dev-file';
  private readonly profileId: string;

  constructor(profileId: string = 'default') {
    this.profileId = profileId;
  }

  private apiUrl(): string {
    return `/api/wardrobe?profile=${encodeURIComponent(this.profileId)}`;
  }

  async load(): Promise<WardrobeData | null> {
    try {
      const response = await fetch(this.apiUrl());
      if (response.ok) {
        const parsed: unknown = await response.json();
        if (parsed && isWardrobeData(parsed)) {
          return normalizeWardrobeData(parsed);
        }
      }
    } catch {
      // fall through
    }

    try {
      const raw = localStorage.getItem(storageKey(this.profileId));
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isWardrobeData(parsed)) return null;
      const normalized = normalizeWardrobeData(parsed);
      await this.save(normalized);
      return normalized;
    } catch {
      return null;
    }
  }

  async save(data: WardrobeData): Promise<void> {
    const json = JSON.stringify(data);

    try {
      localStorage.setItem(storageKey(this.profileId), json);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Browser storage is full. Remove old photos or clear site data.');
      }
      throw error;
    }

    const response = await fetch(this.apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    });

    if (!response.ok) {
      throw new Error('Could not save wardrobe data to local file.');
    }
  }
}
