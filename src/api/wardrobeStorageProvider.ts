import type { WardrobeData, WardrobeStorageProvider } from '@/storage/types';
import { apiClient } from '@/api/client';
import type { GiftRecord, Look, LoftBox, WardrobeItem } from '@/types';

interface WardrobeApiSnapshot {
  activeCollectionId: string;
  collections: unknown[];
  items: unknown[];
  looks: unknown[];
  loftBoxes: unknown[];
  gifts: unknown[];
}

export class ApiWardrobeStorageProvider implements WardrobeStorageProvider {
  readonly id = 'api';

  async load(): Promise<WardrobeData | null> {
    try {
      const snapshot = await apiClient.getWardrobeSnapshot();
      if (!snapshot) return null;
      return {
        collections: Array.isArray(snapshot.collections) ? (snapshot.collections as WardrobeData['collections']) : [],
        items: Array.isArray(snapshot.items) ? (snapshot.items as WardrobeData['items']) : [],
        looks: Array.isArray(snapshot.looks) ? (snapshot.looks as WardrobeData['looks']) : [],
        loftBoxes: Array.isArray(snapshot.loftBoxes) ? (snapshot.loftBoxes as WardrobeData['loftBoxes']) : [],
        gifts: Array.isArray(snapshot.gifts) ? (snapshot.gifts as WardrobeData['gifts']) : [],
        activeCollectionId:
          typeof snapshot.activeCollectionId === 'string' ? snapshot.activeCollectionId : '',
      };
    } catch {
      return null;
    }
  }

  async save(data: WardrobeData): Promise<void> {
    const payload: WardrobeApiSnapshot = {
      activeCollectionId: data.activeCollectionId,
      collections: data.collections,
      items: data.items,
      looks: data.looks,
      loftBoxes: data.loftBoxes,
      gifts: data.gifts,
    };
    await apiClient.saveWardrobeSnapshot(payload);
  }

  async saveItem(item: WardrobeItem): Promise<void> {
    await apiClient.saveItem(item as unknown as Record<string, unknown>);
  }

  async saveLook(look: Look): Promise<void> {
    await apiClient.saveLook(look as unknown as Record<string, unknown>);
  }

  async saveLoftBox(loftBox: LoftBox): Promise<void> {
    await apiClient.saveLoftBox(loftBox as unknown as Record<string, unknown>);
  }

  async saveGift(gift: GiftRecord): Promise<void> {
    await apiClient.createDonation(gift as unknown as Record<string, unknown>);
  }

  async planTrip(payload: Record<string, unknown>): Promise<void> {
    await apiClient.planTrip(payload);
  }
}
