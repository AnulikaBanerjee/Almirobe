import { DEFAULT_SHELF_COUNT } from '@/types';
import type { LoftBox, WardrobeCollection, WardrobeItem } from '@/types';
import type { WardrobeData } from '@/storage/types';

export function normalizeCollection(collection: WardrobeCollection): WardrobeCollection {
  return {
    ...collection,
    displayMode: collection.displayMode ?? 'category',
    shelfCount: collection.shelfCount ?? DEFAULT_SHELF_COUNT,
    enableSeasonFilter: collection.enableSeasonFilter ?? true,
  };
}

export function normalizeItem(item: WardrobeItem): WardrobeItem {
  return {
    ...item,
    shelfIndex: item.shelfIndex ?? 0,
    lentStatus: item.lentStatus ?? null,
    markedForDonation: item.markedForDonation ?? false,
    loftBoxId: item.loftBoxId ?? null,
  };
}

export function normalizeLoftBox(box: LoftBox): LoftBox {
  return { ...box };
}

export function normalizeWardrobeData(data: WardrobeData): WardrobeData {
  return {
    ...data,
    collections: data.collections.map(normalizeCollection),
    items: data.items.map(normalizeItem),
    loftBoxes: (data.loftBoxes ?? []).map(normalizeLoftBox),
  };
}
