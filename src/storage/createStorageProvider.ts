import { ApiWardrobeStorageProvider } from '@/api/wardrobeStorageProvider';
import { DevFileStorageProvider } from '@/storage/devFileStorageProvider';
import { LocalStorageProvider } from '@/storage/localStorageProvider';
import type { StorageProviderKind, WardrobeStorageProvider } from '@/storage/types';

function storageProviderFromEnv(): StorageProviderKind {
  const value = import.meta.env.VITE_WARDROBE_PROVIDER;
  if (value === 'api') return 'api';
  if (value === 'local' || !value) return 'local';
  console.warn(`Unknown VITE_WARDROBE_PROVIDER "${value}", falling back to local.`);
  return 'local';
}

/**
 * Single switch point for persistence backend.
 * In dev, local-only mode uses the dev file-backed provider.
 * When the API provider is selected, data is persisted via the Spring backend.
 */
export function createStorageProvider(
  kind: StorageProviderKind = storageProviderFromEnv(),
  profileId: string = 'default'
): WardrobeStorageProvider {
  if (import.meta.env.DEV && kind === 'local') {
    return new DevFileStorageProvider(profileId);
  }

  switch (kind) {
    case 'local':
      return new LocalStorageProvider(profileId);
    case 'api':
      return new ApiWardrobeStorageProvider();
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
