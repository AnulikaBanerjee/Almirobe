import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Heart, Plus, Search, X } from 'lucide-react';
import type { WardrobeCollection, WardrobeItem } from '@/types';
import { DEFAULT_SHELF_COUNT } from '@/types';
import {
  ALL_SEASONS_FILTER_LABEL,
  itemMatchesSeasonFilter,
  SEASON_FILTER_OPTIONS,
  seasonFilterChipLabel,
  type SeasonFilterValue,
} from '@/filters';
import { getItemPlacementLabel } from '@/items/itemLocation';
import { getWardrobeIcon } from '@/wardrobeIcons';
import ItemImage from '@/components/ItemImage';
import ModalPortal from '@/components/ModalPortal';

interface AddToLoftBoxModalProps {
  boxName: string;
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  onClose: () => void;
  onAdd: (itemIds: string[]) => void;
}

function FilterChip({
  label,
  active,
  onClick,
  small,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full font-medium transition-all whitespace-nowrap ${
        small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      } ${
        active
          ? 'bg-wardrobe-accent-gold/20 text-wardrobe-accent-gold border border-wardrobe-accent-gold/40'
          : 'bg-ink-900/50 text-ink-400 border border-ink-700/40 hover:border-ink-600 hover:text-ink-300'
      }`}
    >
      {label}
    </button>
  );
}

export default function AddToLoftBoxModal({
  boxName,
  items,
  collections,
  onClose,
  onAdd,
}: AddToLoftBoxModalProps) {
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [activeSeasonFilter, setActiveSeasonFilter] = useState<SeasonFilterValue>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const packableItems = useMemo(
    () => items.filter((item) => !item.loftBoxId && !item.markedForDonation),
    [items]
  );

  const wardrobeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const collection of collections) {
      counts[collection.id] = packableItems.filter((i) => i.collectionId === collection.id).length;
    }
    return counts;
  }, [collections, packableItems]);

  const activeWardrobe = selectedWardrobeId
    ? collections.find((c) => c.id === selectedWardrobeId)
    : undefined;

  const isShelfMode = (activeWardrobe?.displayMode ?? 'category') === 'shelf';
  const shelfCount = activeWardrobe?.shelfCount ?? DEFAULT_SHELF_COUNT;
  const showSeasonFilters = activeWardrobe?.enableSeasonFilter ?? true;

  const wardrobeItems = useMemo(() => {
    if (!selectedWardrobeId) return [];
    return packableItems.filter((item) => item.collectionId === selectedWardrobeId);
  }, [packableItems, selectedWardrobeId]);

  const filteredItems = useMemo(() => {
    return wardrobeItems.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.color.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (isShelfMode) {
        if (activeCategoryId !== 'all' && String(item.shelfIndex ?? 0) !== activeCategoryId) return false;
      } else if (activeCategoryId !== 'all' && item.categoryId !== activeCategoryId) {
        return false;
      }
      if (showSeasonFilters && !itemMatchesSeasonFilter(item, activeSeasonFilter)) return false;
      if (showFavoritesOnly && !item.favorite) return false;
      return true;
    });
  }, [
    wardrobeItems,
    search,
    isShelfMode,
    activeCategoryId,
    showSeasonFilters,
    activeSeasonFilter,
    showFavoritesOnly,
  ]);

  const shelfRows = Array.from({ length: shelfCount }, (_, i) => ({
    id: String(i),
    label: `Shelf ${i + 1}`,
  }));

  const openWardrobe = (wardrobeId: string) => {
    setSelectedWardrobeId(wardrobeId);
    setSearch('');
    setActiveCategoryId('all');
    setActiveSeasonFilter(null);
    setShowFavoritesOnly(false);
  };

  const backToWardrobes = () => {
    setSelectedWardrobeId(null);
    setSearch('');
    setActiveCategoryId('all');
    setActiveSeasonFilter(null);
    setShowFavoritesOnly(false);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    if (selected.size === 0) return;
    onAdd(Array.from(selected));
    onClose();
  };

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={400}>
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[min(85vh,720px)] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-5 border-b border-ink-700 flex-shrink-0">
          {selectedWardrobeId && (
            <button
              type="button"
              onClick={backToWardrobes}
              className="text-ink-400 hover:text-ink-200 flex-shrink-0"
              aria-label="Back to wardrobes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-serif text-ink-50 truncate">
              {selectedWardrobeId && activeWardrobe
                ? activeWardrobe.name
                : `Add to ${boxName}`}
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {selectedWardrobeId
                ? `${filteredItems.length} of ${wardrobeItems.length} pieces`
                : 'Choose a wardrobe'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-200 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!selectedWardrobeId ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-2">
            {collections.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-8">No wardrobes yet.</p>
            ) : (
              collections.map((collection) => {
                const Icon = getWardrobeIcon(collection.icon);
                const count = wardrobeCounts[collection.id] ?? 0;
                return (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => openWardrobe(collection.id)}
                    disabled={count === 0}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      count === 0
                        ? 'border-ink-800/50 opacity-50 cursor-not-allowed'
                        : 'border-ink-700/50 hover:border-amber-600/40 hover:bg-ink-900/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-wardrobe-accent-gold to-amber-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-ink-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-100 truncate">{collection.name}</p>
                      <p className="text-xs text-ink-500">
                        {count} piece{count === 1 ? '' : 's'} available
                      </p>
                    </div>
                    {count > 0 && <ChevronRight className="w-4 h-4 text-ink-500 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <>
            <div className="px-5 pt-4 flex-shrink-0 space-y-2 border-b border-ink-700/50 pb-4">
              <div className="flex gap-1.5 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${activeWardrobe?.name?.toLowerCase() ?? 'wardrobe'}...`}
                    className="w-full bg-ink-900/70 border border-ink-700/60 rounded-lg pl-8 pr-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFavoritesOnly((v) => !v)}
                  className={`px-2.5 py-2 rounded-lg border transition-all ${
                    showFavoritesOnly
                      ? 'border-wardrobe-accent-rose/50 bg-wardrobe-accent-rose/15 text-wardrobe-accent-rose'
                      : 'border-ink-700/60 text-ink-400 hover:text-ink-200'
                  }`}
                  aria-label="Favorites only"
                >
                  <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                <FilterChip
                  label="All"
                  active={activeCategoryId === 'all'}
                  onClick={() => setActiveCategoryId('all')}
                />
                {isShelfMode
                  ? shelfRows.map((shelf) => (
                      <FilterChip
                        key={shelf.id}
                        label={shelf.label}
                        active={activeCategoryId === shelf.id}
                        onClick={() => setActiveCategoryId(shelf.id)}
                      />
                    ))
                  : activeWardrobe?.categories.map((cat) => (
                      <FilterChip
                        key={cat.id}
                        label={cat.label}
                        active={activeCategoryId === cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                      />
                    ))}
              </div>

              {showSeasonFilters && (
                <div className="flex flex-wrap gap-1">
                  <FilterChip
                    label={ALL_SEASONS_FILTER_LABEL}
                    active={activeSeasonFilter === null}
                    onClick={() => setActiveSeasonFilter(null)}
                    small
                  />
                  {SEASON_FILTER_OPTIONS.map((season) => (
                    <FilterChip
                      key={season}
                      label={seasonFilterChipLabel(season)}
                      active={activeSeasonFilter === season}
                      onClick={() => setActiveSeasonFilter(season)}
                      small
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-2">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-ink-500 text-center py-8">
                  {wardrobeItems.length === 0
                    ? 'No pieces available in this wardrobe.'
                    : 'No pieces match your filters.'}
                </p>
              ) : (
                filteredItems.map((item) => {
                  const isOn = selected.has(item.id);
                  const placement = getItemPlacementLabel(item, activeWardrobe);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                        isOn ? 'border-amber-500/50 bg-amber-950/20' : 'border-ink-700/50 hover:border-ink-600'
                      }`}
                    >
                      <div className="w-10 h-12 rounded-lg overflow-hidden border border-ink-700/50 flex-shrink-0">
                        <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-100 truncate">{item.name}</p>
                        <p className="text-xs text-ink-500 truncate">{item.brand}</p>
                        <p className="text-xs text-amber-500/80 mt-0.5">{placement}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex-shrink-0 ${
                          isOn ? 'bg-amber-500 border-amber-500' : 'border-ink-600'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}

        <div className="p-5 border-t border-ink-700 flex-shrink-0 space-y-2">
          {selected.size > 0 && !selectedWardrobeId && (
            <p className="text-xs text-center text-amber-400/90">
              {selected.size} piece{selected.size === 1 ? '' : 's'} selected across wardrobes
            </p>
          )}
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            Pack {selected.size > 0 ? `${selected.size} ` : ''}into loft
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
