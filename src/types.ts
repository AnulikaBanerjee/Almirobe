export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all';

export interface WardrobeCategory {
  id: string;
  label: string;
}

export interface WardrobeCollection {
  id: string;
  name: string;
  icon: string;
  categories: WardrobeCategory[];
}

export interface WardrobeItem {
  id: string;
  collectionId: string;
  name: string;
  categoryId: string;
  color: string;
  colorHex: string;
  brand: string;
  size: string;
  season: Season;
  notes?: string;
  imageData?: string;
  favorite: boolean;
  inLaundry: boolean;
  createdAt: number;
}

export interface Look {
  id: string;
  name: string;
  primaryItemId: string;
  itemIds: string[];
  notes?: string;
  createdAt: number;
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
  all: 'All Season',
};

export const SEASONS: Season[] = ['all', 'spring', 'summer', 'fall', 'winter'];
