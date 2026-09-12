import type { WardrobeItem } from '@/types';

const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

/** Last time item was worn; falls back to createdAt until wear logging is used. */
export function getLastWornAt(item: WardrobeItem): number {
  return item.lastWornAt ?? item.createdAt;
}

export function monthsSinceWorn(item: WardrobeItem, now = Date.now()): number {
  const elapsed = now - getLastWornAt(item);
  return elapsed / MS_PER_MONTH;
}

export function getUnwornItems(items: WardrobeItem[], monthsThreshold: number): WardrobeItem[] {
  return items
    .filter((item) => monthsSinceWorn(item) >= monthsThreshold)
    .sort((a, b) => getLastWornAt(a) - getLastWornAt(b));
}

export function markItemWornToday(item: WardrobeItem): WardrobeItem {
  return {
    ...item,
    lastWornAt: Date.now(),
    wearCount: (item.wearCount ?? 0) + 1,
  };
}
