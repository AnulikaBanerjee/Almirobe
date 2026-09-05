import { LocalStorageProvider } from '@/storage/localStorageProvider';
import type { StorageProviderKind, WardrobeStorageProvider } from '@/storage/types';

/**
 * Single switch point for persistence backend.
 * To add cloud storage later:
 *   1. Implement WardrobeStorageProvider (e.g. SupabaseStorageProvider)
 *   2. Extend StorageProviderKind
 *   3. Add a case here — App/hooks stay unchanged
 */
export function createStorageProvider(kind: StorageProviderKind = 'local'): WardrobeStorageProvider {
  switch (kind) {
    case 'local':
      return new LocalStorageProvider();
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
