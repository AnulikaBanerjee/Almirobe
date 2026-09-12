import { useEffect, useMemo, useState } from 'react';
import { Check, Package, RotateCcw } from 'lucide-react';
import type { WardrobeCollection, WardrobeItem } from '@/types';
import AppPageShell from '@/components/pages/AppPageShell';
import ItemImage from '@/components/ItemImage';
import { getItemLocationSummary } from '@/items/itemLocation';

interface DonationBoxPageProps {
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  onBack: () => void;
  onReturnToWardrobe: (itemIds: string[]) => void;
  onCompleteDonation: (itemIds: string[]) => void;
}

export default function DonationBoxPage({
  items,
  collections,
  onBack,
  onReturnToWardrobe,
  onCompleteDonation,
}: DonationBoxPageProps) {
  const donationItems = useMemo(
    () =>
      items
        .filter((item) => item.markedForDonation)
        .sort((a, b) => (b.donationMarkedAt ?? 0) - (a.donationMarkedAt ?? 0)),
    [items]
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDonate, setConfirmDonate] = useState(false);

  useEffect(() => {
    setConfirmDonate(false);
  }, [selected]);

  const allSelected = donationItems.length > 0 && selected.size === donationItems.length;
  const someSelected = selected.size > 0;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(donationItems.map((i) => i.id)));
    }
  };

  const selectedIds = Array.from(selected);

  const handleReturn = () => {
    if (!someSelected) return;
    onReturnToWardrobe(selectedIds);
    setSelected(new Set());
    setConfirmDonate(false);
  };

  const handleDonate = () => {
    if (!someSelected) return;
    if (!confirmDonate) {
      setConfirmDonate(true);
      return;
    }
    onCompleteDonation(selectedIds);
    setSelected(new Set());
    setConfirmDonate(false);
  };

  return (
    <AppPageShell
      title="Donation Box"
      subtitle="Pieces you've set aside to give away"
      icon={Package}
      iconClassName="text-emerald-400"
      onBack={onBack}
      wide
    >
      {donationItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center mx-auto mb-3">
            <Package className="w-7 h-7 text-emerald-400/70" />
          </div>
          <p className="text-ink-300 text-sm">Your donation box is empty</p>
          <p className="text-ink-500 text-xs mt-1 max-w-xs mx-auto">
            Drag items to the Donate bin inside a wardrobe to add them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm text-ink-300 hover:text-ink-100 transition-colors"
            >
              <span
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  allSelected
                    ? 'bg-emerald-500 border-emerald-500 text-ink-900'
                    : 'border-ink-600 bg-ink-900/50'
                }`}
              >
                {allSelected && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
              {allSelected ? 'Deselect all' : 'Select all'}
              <span className="text-ink-500">({donationItems.length})</span>
            </button>
            {someSelected && (
              <span className="text-xs text-ink-500">{selected.size} selected</span>
            )}
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
            {donationItems.map((item) => {
              const isSelected = selected.has(item.id);
              const { wardrobe, placement } = getItemLocationSummary(item, collections);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleOne(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-950/30'
                      : 'border-ink-700/50 bg-ink-900/30 hover:border-ink-600'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500 text-ink-900'
                        : 'border-ink-600 bg-ink-900/50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                  <div className="w-12 h-14 rounded-lg overflow-hidden border border-ink-700/50 flex-shrink-0">
                    <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-100 truncate">{item.name}</p>
                    <p className="text-xs text-ink-500 truncate">{item.brand}</p>
                    <p className="text-xs text-emerald-400/90 mt-1">
                      {wardrobe} · {placement}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {confirmDonate && someSelected && (
            <p className="text-xs text-amber-300/90 text-center px-2">
              {selected.size} piece{selected.size === 1 ? '' : 's'} will be removed from your wardrobe
              permanently. Tap Donated again to confirm.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-ink-700/50">
            <button
              type="button"
              disabled={!someSelected}
              onClick={handleReturn}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-ink-200 border border-ink-700 hover:bg-ink-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Put back in wardrobe
            </button>
            <button
              type="button"
              disabled={!someSelected}
              onClick={handleDonate}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                confirmDonate
                  ? 'text-white bg-emerald-600 hover:bg-emerald-500'
                  : 'text-ink-900 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20'
              }`}
            >
              <Package className="w-4 h-4" />
              {confirmDonate ? 'Confirm donated' : 'Donated'}
            </button>
          </div>
        </div>
      )}
    </AppPageShell>
  );
}
