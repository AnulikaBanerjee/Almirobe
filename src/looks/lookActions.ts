import type { Look, LookPieceLayout } from '@/types';

export interface LookDraftInput {
  primaryItemId: string;
  itemIds: string[];
  name: string;
  existingLook?: Look;
  /** Pass a string (including '') to replace notes. Omit to keep the saved notes. */
  notes?: string;
  /** Pass an array to replace the saved arrangement. Omit to keep it. */
  layout?: LookPieceLayout[];
}

/** Ordered member ids for display — primary first, no duplicates. */
export function getLookMemberIds(look: Look): string[] {
  return [look.primaryItemId, ...look.itemIds.filter((id) => id !== look.primaryItemId)];
}

/** Remove a deleted item from all looks; promote the next piece when primary is removed. */
export function removeItemFromLooks(looks: Look[], deletedItemId: string): Look[] {
  return looks
    .map((look) => {
      const remainingIds = look.itemIds.filter((itemId) => itemId !== deletedItemId);

      if (look.primaryItemId !== deletedItemId) {
        return { ...look, itemIds: remainingIds };
      }

      const nextPrimaryId = remainingIds[0] ?? '';
      return {
        ...look,
        primaryItemId: nextPrimaryId,
        itemIds: nextPrimaryId ? remainingIds.slice(1) : [],
      };
    })
    .filter((look) => look.primaryItemId !== '');
}

/** Build a Look from form state — preserves id/createdAt when editing. */
export function buildLookFromDraft(input: LookDraftInput): Look {
  const itemIds = input.itemIds.filter((id) => id !== input.primaryItemId);

  const notes =
    input.notes !== undefined ? input.notes.trim() || undefined : input.existingLook?.notes;
  const layout = input.layout !== undefined ? input.layout : input.existingLook?.layout;

  if (input.existingLook) {
    return {
      ...input.existingLook,
      name: input.name,
      primaryItemId: input.primaryItemId,
      itemIds,
      notes,
      layout,
    };
  }

  return {
    id: `look-${Date.now()}`,
    name: input.name,
    primaryItemId: input.primaryItemId,
    itemIds,
    notes,
    layout,
    createdAt: Date.now(),
  };
}

/** Insert or replace by id — safe for create and edit flows. */
export function upsertLook(looks: Look[], look: Look): Look[] {
  const exists = looks.some((entry) => entry.id === look.id);
  if (!exists) return [...looks, look];
  return looks.map((entry) => (entry.id === look.id ? look : entry));
}
