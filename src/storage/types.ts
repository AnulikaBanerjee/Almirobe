import type { GiftRecord, Look, LoftBox, WardrobeCollection, WardrobeItem } from '@/types';

/** Persisted wardrobe snapshot — independent of UI/session state. */
export interface WardrobeData {
  collections: WardrobeCollection[];
  items: WardrobeItem[];
  looks: Look[];
  loftBoxes: LoftBox[];
  gifts: GiftRecord[];
  activeCollectionId: string;
}

/**
 * Pluggable persistence layer. Implement this for localStorage, Supabase,
 * IndexedDB, etc. App code should depend only on this interface.
 */
export interface WardrobeStorageProvider {
  readonly id: string;
  load(): Promise<WardrobeData | null>;
  save(data: WardrobeData): Promise<void>;
}

export type StorageProviderKind = 'local';
