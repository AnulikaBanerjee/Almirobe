import type { WardrobeItem } from '@/types';

export type DropZoneId = 'laundry' | 'donation' | 'delete';

export interface ItemDragState {
  item: WardrobeItem;
  x: number;
  y: number;
  activeZone: DropZoneId | null;
}
