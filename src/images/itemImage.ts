import type { WardrobeItem } from '@/types';

/** Best available image reference on an item (newest field first). */
export function getItemImageRef(item: WardrobeItem): string | undefined {
  return item.imageUrl ?? item.imageData;
}
