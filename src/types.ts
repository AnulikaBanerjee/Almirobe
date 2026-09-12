export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all';

export type WardrobeDisplayMode = 'category' | 'shelf';

export type LentStatus = 'lent' | 'borrowed';

/** Storage box in the loft — holds out-of-season or packed-away clothes */
export interface LoftBox {
  id: string;
  name: string;
  /** User photo of the physical bag/box for quick identification */
  imageUrl?: string;
  notes?: string;
  createdAt: number;
}

export interface WardrobeCategory {
  id: string;
  label: string;
}

export interface WardrobeCollection {
  id: string;
  name: string;
  icon: string;
  categories: WardrobeCategory[];
  /** Group items by category labels (tops, bottoms) or physical shelf numbers. */
  displayMode?: WardrobeDisplayMode;
  /** Number of shelves when displayMode is 'shelf'. */
  shelfCount?: number;
  /** Show season filter chips in this wardrobe. */
  enableSeasonFilter?: boolean;
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
  /** @deprecated Prefer imageUrl — kept for backward compatibility */
  imageData?: string;
  /** Persistent image URL (local disk, Supabase, or indexeddb ref) */
  imageUrl?: string;
  /** Shelf index (0-based) when wardrobe uses shelf display mode */
  shelfIndex?: number;
  favorite: boolean;
  inLaundry: boolean;
  /** Queued for donation pickup — item stays in wardrobe until removed */
  markedForDonation?: boolean;
  donationMarkedAt?: number;
  /** When set, item is packed away in this loft box (hidden from wardrobe) */
  loftBoxId?: string | null;
  lentStatus?: LentStatus | null;
  lentParty?: string;
  lentDate?: number;
  lentNotes?: string;
  purchasePrice?: number;
  purchaseDate?: number;
  /** Updated when item is worn or marked via outfit logging */
  lastWornAt?: number;
  wearCount?: number;
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

export const DEFAULT_SHELF_COUNT = 4;
