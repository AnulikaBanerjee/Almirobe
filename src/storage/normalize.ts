import { DEFAULT_SHELF_COUNT } from '@/types';
import type { LoftBox, WardrobeCollection, WardrobeItem } from '@/types';
import type { WardrobeData } from '@/storage/types';

const MS_MONTH = 30 * 24 * 60 * 60 * 1000;

/** Seed items treated as unused so they appear on the 3-month declutter list. */
function seedLastWorn(id: string): number | undefined {
  const months: Record<string, number> = {
    c3: 8,
    c5: 5,
    c6: 4,
    s4: 6,
  };
  const n = months[id];
  return n ? Date.now() - n * MS_MONTH : undefined;
}

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
    lastWornAt: item.lastWornAt ?? seedLastWorn(item.id),
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
