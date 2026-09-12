import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ImageStorageProvider, StoredImage } from '@/images/types';

const BUCKET = 'wardrobe-images';

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error('Invalid image data');
  const mime = match[1];
  const ext =
    mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const bytes = atob(match[2]);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return { blob: new Blob([buffer], { type: mime }), ext };
}

export class SupabaseImageProvider implements ImageStorageProvider {
  readonly id = 'supabase';
  private client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  async upload(dataUrl: string): Promise<StoredImage> {
    const { blob, ext } = dataUrlToBlob(dataUrl);
    const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const path = `items/${id}.${ext}`;

    const { error } = await this.client.storage.from(BUCKET).upload(path, blob, {
      contentType: blob.type,
      upsert: false,
    });
    if (error) throw error;

    const { data } = this.client.storage.from(BUCKET).getPublicUrl(path);
    return { id: path, url: data.publicUrl };
  }

  async resolveUrl(ref: string): Promise<string | null> {
    if (ref.startsWith('http')) return ref;
    const { data } = this.client.storage.from(BUCKET).getPublicUrl(ref);
    return data.publicUrl;
  }

  async delete(id: string): Promise<void> {
    await this.client.storage.from(BUCKET).remove([id]);
  }
}
