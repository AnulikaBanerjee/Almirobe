import type { Look, WardrobeItem } from '@/types';

/** Context for opening the look composer — create or edit. */
export interface LookEditorContext {
  primaryItem: WardrobeItem;
  existingLook?: Look;
}
