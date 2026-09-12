import { IndexedDbImageProvider } from '@/images/indexedDbImageProvider';
import { LocalDiskImageProvider } from '@/images/localDiskImageProvider';
import { SupabaseImageProvider } from '@/images/supabaseImageProvider';
import type { ImageProviderKind, ImageStorageProvider } from '@/images/types';

export function createImageProvider(kind: ImageProviderKind = 'auto'): ImageStorageProvider {
  const envKind = import.meta.env.VITE_IMAGE_PROVIDER as ImageProviderKind | undefined;
  const resolved = kind === 'auto' ? (envKind ?? 'auto') : kind;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (resolved === 'supabase' || (resolved === 'auto' && supabaseUrl && supabaseKey)) {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase image provider requested but env vars are missing; using local disk.');
    } else {
      return new SupabaseImageProvider(supabaseUrl, supabaseKey);
    }
  }

  if (resolved === 'indexeddb') {
    return new IndexedDbImageProvider();
  }

  if (import.meta.env.DEV) {
    return new LocalDiskImageProvider();
  }

  return new IndexedDbImageProvider();
}
