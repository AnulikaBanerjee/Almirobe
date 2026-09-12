import { useMemo } from 'react';
import type { WardrobeCollection, WardrobeItem } from '@/types';
import {
  countByBrand,
  formatCurrency,
  spendByBrand,
  spendByMonth,
  spendByWardrobe,
  summarizePurchases,
} from '@/reports/purchaseReport';
import SimpleBarChart from '@/components/menu/SimpleBarChart';
import SimplePieChart from '@/components/menu/SimplePieChart';

interface PurchaseReportPanelProps {
  items: WardrobeItem[];
  collections: WardrobeCollection[];
}

export default function PurchaseReportPanel({ items, collections }: PurchaseReportPanelProps) {
  const summary = useMemo(() => summarizePurchases(items), [items]);
  const brandSpend = useMemo(() => spendByBrand(items), [items]);
  const wardrobeSpend = useMemo(() => spendByWardrobe(items, collections), [items, collections]);
  const brandCount = useMemo(() => countByBrand(items), [items]);
  const monthlySpend = useMemo(() => spendByMonth(items), [items]);

  const hasPricing = summary.pricedItems > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-lg border border-ink-700 p-2">
          <p className="text-ink-500">Total spend</p>
          <p className="text-base text-wardrobe-accent-gold font-medium">{formatCurrency(summary.totalSpend)}</p>
        </div>
        <div className="rounded-lg border border-ink-700 p-2">
          <p className="text-ink-500">Priced items</p>
          <p className="text-base text-ink-100">{summary.pricedItems}/{summary.totalItems}</p>
        </div>
        <div className="rounded-lg border border-ink-700 p-2">
          <p className="text-ink-500">Avg price</p>
          <p className="text-base text-ink-100">{formatCurrency(summary.avgPrice)}</p>
        </div>
        <div className="rounded-lg border border-ink-700 p-2">
          <p className="text-ink-500">Brands</p>
          <p className="text-base text-ink-100">{brandCount.length}</p>
        </div>
      </div>

      {!hasPricing && (
        <p className="text-xs text-ink-400 bg-ink-900/40 border border-ink-700/50 rounded-lg p-3">
          Add <strong className="text-ink-300">purchase price</strong> and <strong className="text-ink-300">date</strong> when
          adding or editing items to unlock spend charts.
        </p>
      )}

      <section>
        <h4 className="text-xs uppercase tracking-wider text-ink-500 mb-3">Spend by brand</h4>
        <SimplePieChart slices={brandSpend} valuePrefix="$" />
      </section>

      <section>
        <h4 className="text-xs uppercase tracking-wider text-ink-500 mb-3">Spend by wardrobe</h4>
        <SimplePieChart slices={wardrobeSpend} valuePrefix="$" />
      </section>

      <section>
        <h4 className="text-xs uppercase tracking-wider text-ink-500 mb-3">Items by brand</h4>
        <SimplePieChart slices={brandCount} />
      </section>

      <section>
        <h4 className="text-xs uppercase tracking-wider text-ink-500 mb-3">Monthly spend</h4>
        <SimpleBarChart slices={monthlySpend} />
      </section>
    </div>
  );
}
