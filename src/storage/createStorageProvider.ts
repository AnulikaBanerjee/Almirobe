import { DevFileStorageProvider } from '@/storage/devFileStorageProvider';
import { LocalStorageProvider } from '@/storage/localStorageProvider';
import type { StorageProviderKind, WardrobeStorageProvider } from '@/storage/types';

/**
 * Single switch point for persistence backend.
 * In dev: file-backed storage (data/wardrobe-data.json) + localStorage mirror.
 * In production build: localStorage until Supabase is wired.
 */
export function createStorageProvider(
  kind: StorageProviderKind = 'local',
  profileId: string = 'default'
): WardrobeStorageProvider {
  if (import.meta.env.DEV) {
    return new DevFileStorageProvider(profileId);
  }

  switch (kind) {
    case 'local':
      return new LocalStorageProvider();
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
