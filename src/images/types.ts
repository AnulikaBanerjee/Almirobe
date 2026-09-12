export type ImageProviderKind = 'auto' | 'local-disk' | 'indexeddb' | 'supabase';

export interface StoredImage {
  id: string;
  url: string;
}

export interface ImageStorageProvider {
  readonly id: string;
  upload(dataUrl: string): Promise<StoredImage>;
  resolveUrl(ref: string): Promise<string | null>;
  delete?(id: string): Promise<void>;
}
