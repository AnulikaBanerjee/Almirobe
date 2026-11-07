import { normalizeWardrobeData } from '@/storage/normalize';
import type { WardrobeData, WardrobeStorageProvider } from '@/storage/types';

function storageKey(profileId: string): string {
  return `my-wardrobe-data-v1-${profileId}`;
}

function legacyStorageKey(): string {
  return 'my-wardrobe-data-v1';
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

export class LocalStorageProvider implements WardrobeStorageProvider {
  readonly id = 'local';
  private readonly profileId: string;

  constructor(profileId: string = 'default') {
    this.profileId = profileId;
  }

  async load(): Promise<WardrobeData | null> {
    try {
      const profileKey = storageKey(this.profileId);
      const profileRaw = localStorage.getItem(profileKey);
      if (profileRaw) {
        const parsed: unknown = JSON.parse(profileRaw);
        if (isWardrobeData(parsed)) {
          return normalizeWardrobeData(parsed);
        }
      }

      const legacyRaw = localStorage.getItem(legacyStorageKey());
      if (!legacyRaw) return null;

      const parsed: unknown = JSON.parse(legacyRaw);
      if (!isWardrobeData(parsed)) return null;

      const normalized = normalizeWardrobeData(parsed);
      localStorage.setItem(profileKey, JSON.stringify(normalized));
      return normalized;
    } catch {
      return null;
    }
  }

  async save(data: WardrobeData): Promise<void> {
    const profileKey = storageKey(this.profileId);
    localStorage.setItem(profileKey, JSON.stringify(data));
    if (this.profileId !== 'default') {
      localStorage.setItem(legacyStorageKey(), JSON.stringify(data));
    }
  }

  /** Useful for tests or a future "reset wardrobe" action. */
  async clear(): Promise<void> {
    localStorage.removeItem(storageKey(this.profileId));
    if (this.profileId !== 'default') {
      localStorage.removeItem(legacyStorageKey());
    }
  }
}
