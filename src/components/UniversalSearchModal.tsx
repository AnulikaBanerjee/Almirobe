import { useMemo, useState } from 'react';
import { Package, Search, Shirt, WashingMachine, ArrowRightLeft, Warehouse, X } from 'lucide-react';
import type { LoftBox, WardrobeCollection, WardrobeItem } from '@/types';
import ItemImage from '@/components/ItemImage';

export type UniversalSearchHit = {
  item: WardrobeItem;
  location: string;
  locationKind: 'wardrobe' | 'laundry' | 'loft' | 'lent' | 'donation';
};

interface UniversalSearchModalProps {
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  loftBoxes: LoftBox[];
  onClose: () => void;
  onSelect: (item: WardrobeItem) => void;
}

function locationFor(
  item: WardrobeItem,
  collections: WardrobeCollection[],
  loftBoxes: LoftBox[]
): Pick<UniversalSearchHit, 'location' | 'locationKind'> {
  if (item.markedForDonation) {
    return { location: 'Donation Box', locationKind: 'donation' };
  }
  if (item.loftBoxId) {
    const box = loftBoxes.find((b) => b.id === item.loftBoxId);
    return { location: box ? `Loft · ${box.name}` : 'The Loft', locationKind: 'loft' };
  }
  if (item.inLaundry) {
    return { location: 'Laundry', locationKind: 'laundry' };
  }
  if (item.lentStatus) {
    const party = item.lentParty ? ` · ${item.lentParty}` : '';
    return {
      location: item.lentStatus === 'lent' ? `Lent out${party}` : `Borrowed${party}`,
      locationKind: 'lent',
    };
  }
  const wardrobe = collections.find((c) => c.id === item.collectionId);
  return { location: wardrobe?.name ?? 'Wardrobe', locationKind: 'wardrobe' };
}

const KIND_ICON = {
  wardrobe: Shirt,
  laundry: WashingMachine,
  loft: Warehouse,
  lent: ArrowRightLeft,
  donation: Package,
} as const;

export default function UniversalSearchModal({
  items,
  collections,
  loftBoxes,
  onClose,
  onSelect,
}: UniversalSearchModalProps) {
  const [query, setQuery] = useState('');

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [] as UniversalSearchHit[];
    return items
      .map((item) => {
        const loc = locationFor(item, collections, loftBoxes);
        return { item, ...loc } satisfies UniversalSearchHit;
      })
      .filter(({ item, location }) => {
        const hay = [
          item.name,
          item.brand,
          item.color,
          item.size,
          item.notes,
          item.productType,
          item.subtype,
          location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [items, collections, loftBoxes, query]);

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-ink-950/40 px-3 pt-[12vh]">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-200/80 bg-[#fffdf8] shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center gap-2 border-b border-amber-100 px-3 py-2.5">
          <Search className="w-4 h-4 text-ink-400 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all wardrobes, loft, laundry, lent…"
            className="flex-1 bg-transparent text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-amber-50"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {query.trim().length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-ink-400">
              Type to search every place your clothes live.
            </p>
          ) : hits.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-ink-400">No matches for “{query.trim()}”</p>
          ) : (
            <ul className="divide-y divide-amber-100/80">
              {hits.map(({ item, location, locationKind }) => {
                const Icon = KIND_ICON[locationKind];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-amber-50/80 transition-colors"
                    >
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-amber-50 border border-amber-100 flex-shrink-0">
                        <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-ink-500 truncate">
                          {[item.brand, item.color].filter(Boolean).join(' · ')}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-400">
                          <Icon className="w-3 h-3" />
                          {location}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
