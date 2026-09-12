import type { WardrobeCollection, WardrobeItem } from '@/types';

export function getItemWardrobeName(
  item: WardrobeItem,
  collections: WardrobeCollection[]
): string {
  return collections.find((c) => c.id === item.collectionId)?.name ?? 'Unknown wardrobe';
}

export function getItemPlacementLabel(
  item: WardrobeItem,
  collection: WardrobeCollection | undefined
): string {
  if (!collection) return 'Unknown location';

  const isShelfMode = (collection.displayMode ?? 'category') === 'shelf';
  if (isShelfMode) {
    const shelf = (item.shelfIndex ?? 0) + 1;
    return `Shelf ${shelf}`;
  }

  const category = collection.categories.find((c) => c.id === item.categoryId);
  return category?.label ?? 'Uncategorized';
}

export function getItemLocationSummary(
  item: WardrobeItem,
  collections: WardrobeCollection[]
): { wardrobe: string; placement: string } {
  const collection = collections.find((c) => c.id === item.collectionId);
  return {
    wardrobe: getItemWardrobeName(item, collections),
    placement: getItemPlacementLabel(item, collection),
  };
}
