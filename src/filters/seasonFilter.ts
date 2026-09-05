import type { Season, WardrobeItem } from '@/types';
import { SEASON_LABELS } from '@/types';

/** `null` = show every season; otherwise match a specific item season tag. */
export type SeasonFilterValue = Season | null;

/** Seasons available as filter chips (excludes the "show all" sentinel). */
export const SEASON_FILTER_OPTIONS: Season[] = ['spring', 'summer', 'fall', 'winter', 'all'];

export const ALL_SEASONS_FILTER_LABEL = 'All seasons';

export function itemMatchesSeasonFilter(item: WardrobeItem, filter: SeasonFilterValue): boolean {
  if (filter === null) return true;
  return item.season === filter;
}

export function seasonFilterChipLabel(season: Season): string {
  return SEASON_LABELS[season];
}
