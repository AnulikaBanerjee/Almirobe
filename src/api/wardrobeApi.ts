import { apiClient } from '@/api/client';
import type { WardrobeData } from '@/storage/types';
import type { GiftRecord, LoftBox, Look, WardrobeCollection, WardrobeItem } from '@/types';

export async function loadWardrobeFromApi(): Promise<WardrobeData | null> {
  const response = await apiClient.getWardrobeSnapshot();
  if (!response) return null;

  return {
    collections: Array.isArray(response.collections) ? (response.collections as WardrobeCollection[]) : [],
    items: Array.isArray(response.items) ? (response.items as WardrobeItem[]) : [],
    looks: Array.isArray(response.looks) ? (response.looks as Look[]) : [],
    loftBoxes: Array.isArray(response.loftBoxes) ? (response.loftBoxes as LoftBox[]) : [],
    gifts: Array.isArray(response.gifts) ? (response.gifts as GiftRecord[]) : [],
    activeCollectionId: typeof response.activeCollectionId === 'string' ? response.activeCollectionId : '',
  };
}

export async function saveWardrobeToApi(data: WardrobeData): Promise<void> {
  await apiClient.saveWardrobeSnapshot({
    activeCollectionId: data.activeCollectionId,
    collections: data.collections,
    items: data.items,
    looks: data.looks,
    loftBoxes: data.loftBoxes,
    gifts: data.gifts,
  });
}
