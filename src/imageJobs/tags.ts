export interface SuggestedTag {
  value: string;
  confidence: number;
}

export interface ImageTags {
  productType?: SuggestedTag | null;
  subtype?: SuggestedTag | null;
  color?: SuggestedTag | null;
  colorHex?: string | null;
  pattern?: SuggestedTag | null;
  occasion?: SuggestedTag | null;
  weather?: SuggestedTag | null;
  suggestedName?: string | null;
  candidates?: { id: string; label: string; confidence: number }[] | null;
}

export const AUTO_SELECT_MIN = 0.4;

export function pickTag(tag?: SuggestedTag | null): string {
  if (!tag) return '';
  return tag.confidence >= AUTO_SELECT_MIN ? tag.value : '';
}
