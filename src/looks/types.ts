import type { Look, WardrobeItem } from '@/types';

/** Context for opening the look composer — create or edit. */
export interface LookEditorContext {
  /** Seed piece when opening from item detail; optional for blank “new look”. */
  primaryItem?: WardrobeItem;
  existingLook?: Look;
}
