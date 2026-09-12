import type { WardrobeCollection, WardrobeItem } from '@/types';
import { colorAt } from '@/reports/chartColors';

export interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

export interface PurchaseSummary {
  totalItems: number;
  pricedItems: number;
  totalSpend: number;
  avgPrice: number;
}

export function summarizePurchases(items: WardrobeItem[]): PurchaseSummary {
  const priced = items.filter((i) => i.purchasePrice != null && i.purchasePrice > 0);
  const totalSpend = priced.reduce((sum, i) => sum + (i.purchasePrice ?? 0), 0);
  return {
    totalItems: items.length,
    pricedItems: priced.length,
    totalSpend,
    avgPrice: priced.length > 0 ? totalSpend / priced.length : 0,
  };
}

export function spendByBrand(items: WardrobeItem[]): ChartSlice[] {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item.purchasePrice || item.purchasePrice <= 0) continue;
    map.set(item.brand, (map.get(item.brand) ?? 0) + item.purchasePrice);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: colorAt(i) }));
}

export function spendByWardrobe(
  items: WardrobeItem[],
  collections: WardrobeCollection[]
): ChartSlice[] {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item.purchasePrice || item.purchasePrice <= 0) continue;
    const name = collections.find((c) => c.id === item.collectionId)?.name ?? 'Other';
    map.set(name, (map.get(name) ?? 0) + item.purchasePrice);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: colorAt(i) }));
}

export function countByBrand(items: WardrobeItem[]): ChartSlice[] {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.brand, (map.get(item.brand) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value], i) => ({ label, value, color: colorAt(i) }));
}

export function spendByMonth(items: WardrobeItem[]): ChartSlice[] {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item.purchasePrice || !item.purchaseDate) continue;
    const d = new Date(item.purchaseDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) ?? 0) + item.purchasePrice);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([label, value], i) => ({ label, value, color: colorAt(i) }));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
