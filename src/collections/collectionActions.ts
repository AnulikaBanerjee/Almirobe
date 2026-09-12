import { INITIAL_COLLECTIONS } from '@/data';
import { removeItemFromLooks } from '@/looks/lookActions';
import type { Look, WardrobeCollection, WardrobeItem } from '@/types';

const BUILTIN_COLLECTION_IDS = new Set(INITIAL_COLLECTIONS.map((c) => c.id));

export function isCustomCollection(collection: WardrobeCollection): boolean {
  return !BUILTIN_COLLECTION_IDS.has(collection.id);
}

export function canDeleteCollection(
  collections: WardrobeCollection[],
  collectionId: string
): boolean {
  if (collections.length <= 1) return false;
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) return false;
  return isCustomCollection(collection);
}

export interface CollectionDeleteResult {
  collections: WardrobeCollection[];
  items: WardrobeItem[];
  looks: Look[];
  nextActiveCollectionId: string;
}

/** Remove a custom wardrobe and cascade-delete its items + look references. */
export function deleteCollectionState(
  collections: WardrobeCollection[],
  items: WardrobeItem[],
  looks: Look[],
  collectionId: string,
  activeCollectionId: string
): CollectionDeleteResult | null {
  if (!canDeleteCollection(collections, collectionId)) return null;

  const itemIdsToRemove = items
    .filter((item) => item.collectionId === collectionId)
    .map((item) => item.id);

  let nextLooks = looks;
  for (const itemId of itemIdsToRemove) {
    nextLooks = removeItemFromLooks(nextLooks, itemId);
  }

  const nextCollections = collections.filter((c) => c.id !== collectionId);
  const nextItems = items.filter((item) => item.collectionId !== collectionId);
  const nextActiveCollectionId =
    activeCollectionId === collectionId
      ? (nextCollections[0]?.id ?? '')
      : activeCollectionId;

  return {
    collections: nextCollections,
    items: nextItems,
    looks: nextLooks,
    nextActiveCollectionId,
  };
}

export interface CategoryDraft {
  id?: string;
  label: string;
}

export interface WardrobeFormInput {
  name: string;
  icon: string;
  categoryDrafts: CategoryDraft[];
  displayMode: 'category' | 'shelf';
  shelfCount: number;
  enableSeasonFilter: boolean;
}

export function buildUpdatedCollection(
  existing: WardrobeCollection,
  input: WardrobeFormInput
): WardrobeCollection {
  const categories = input.categoryDrafts
    .map((draft, index) => ({
      id: draft.id ?? `${existing.id}-cat-${Date.now()}-${index}`,
      label: draft.label.trim(),
    }))
    .filter((category) => category.label.length > 0);

  return {
    ...existing,
    name: input.name.trim(),
    icon: input.icon,
    categories,
    displayMode: input.displayMode,
    shelfCount: input.shelfCount,
    enableSeasonFilter: input.enableSeasonFilter,
  };
}

/** Move items off deleted categories onto the first remaining shelf. */
export function remapItemsForCategoryChanges(
  items: WardrobeItem[],
  collectionId: string,
  updated: WardrobeCollection
): WardrobeItem[] {
  const validCategoryIds = new Set(updated.categories.map((c) => c.id));
  const fallbackCategoryId = updated.categories[0]?.id;

  return items.map((item) => {
    if (item.collectionId !== collectionId) return item;
    if (validCategoryIds.has(item.categoryId)) return item;
    if (!fallbackCategoryId) return item;
    return { ...item, categoryId: fallbackCategoryId };
  });
}
