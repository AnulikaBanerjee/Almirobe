import { INITIAL_COLLECTIONS, INITIAL_ITEMS } from '@/data';
import type { WardrobeData } from '@/storage/types';

export function createDefaultWardrobeData(): WardrobeData {
  return {
    collections: INITIAL_COLLECTIONS,
    items: INITIAL_ITEMS,
    looks: [],
    loftBoxes: [],
    activeCollectionId: INITIAL_COLLECTIONS[0]?.id ?? 'clothes',
  };
}
