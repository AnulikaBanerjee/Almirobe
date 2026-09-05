import { useState } from 'react';
import { Search, Plus, Heart, X, Star, WashingMachine } from 'lucide-react';
import type { WardrobeItem, WardrobeCollection, Season, Look } from '@/types';
import type { LookEditorContext } from '@/looks';
import {
  ALL_SEASONS_FILTER_LABEL,
  itemMatchesSeasonFilter,
  SEASON_FILTER_OPTIONS,
  seasonFilterChipLabel,
  type SeasonFilterValue,
} from '@/filters';
import { SEASON_LABELS, SEASONS } from '@/types';
import PhotoUpload from './PhotoUpload';
import ItemDetailModal from './ItemDetailModal';
import EditItemModal from './EditItemModal';
import CreateLookModal from './CreateLookModal';
import LookViewerModal from './LookViewerModal';

interface WardrobeInteriorProps {
  collection: WardrobeCollection;
  items: WardrobeItem[];
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  looks: Look[];
  onAddItem: (item: WardrobeItem) => void;
  onEditItem: (item: WardrobeItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onSaveLook: (look: Look) => void;
  onDeleteLook: (lookId: string) => void;
  onToggleLaundry: (id: string) => void;
}

function ItemCard({ item, onToggleFavorite, onOpenDetail }: {
  item: WardrobeItem;
  onToggleFavorite: (id: string) => void;
  onOpenDetail: (item: WardrobeItem) => void;
}) {
  return (
    <div
      className="group relative flex flex-col items-center animate-fade-in-up cursor-pointer"
      style={{ animationDelay: '0.05s' }}
      onClick={() => onOpenDetail(item)}
    >
      <div className="relative w-full flex flex-col items-center">
        {/* Hanger hook */}
        <div className="w-px h-2 bg-ink-600/60" />
        {/* Hanger bar */}
        <div className="w-8 h-1 rounded-full bg-gradient-to-b from-amber-700/60 to-amber-900/60 shadow-sm" />

        {/* Photo thumbnail or color swatch */}
        {item.imageData ? (
          <div className="w-full h-16 rounded-md mt-0.5 relative overflow-hidden border border-black/20 transition-transform group-hover:scale-[1.03]">
            <img src={item.imageData} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {item.favorite && (
              <Star className="absolute top-1 right-1 w-3 h-3 text-wardrobe-accent-gold fill-wardrobe-accent-gold drop-shadow" />
            )}
            {item.inLaundry && (
              <WashingMachine className="absolute top-1 left-1 w-3 h-3 text-sky-400 drop-shadow" />
            )}
            <div className="absolute inset-0 bg-wardrobe-accent-gold/0 group-hover:bg-wardrobe-accent-gold/10 transition-colors" />
          </div>
        ) : (
          <div
            className="w-full h-16 rounded-md mt-0.5 relative overflow-hidden border border-black/20 transition-transform group-hover:scale-[1.03]"
            style={{
              background: `linear-gradient(145deg, ${item.colorHex} 0%, ${item.colorHex}cc 60%, ${item.colorHex}88 100%)`,
            }}
          >
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, rgba(0,0,0,0.12) 1px, transparent 3px)' }} />
            {item.favorite && (
              <Star className="absolute top-1 right-1 w-3 h-3 text-wardrobe-accent-gold fill-wardrobe-accent-gold drop-shadow" />
            )}
            {item.inLaundry && (
              <WashingMachine className="absolute top-1 left-1 w-3 h-3 text-sky-400 drop-shadow" />
            )}
          </div>
        )}
      </div>

      {/* Label below */}
      <div className="mt-1 text-center w-full px-0.5">
        <p className="text-[10px] font-medium text-ink-200 leading-tight truncate group-hover:text-ink-100 transition-colors">{item.name}</p>
        <p className="text-[9px] text-ink-500 truncate">{item.brand}</p>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <span className="text-[8px] text-ink-600">{item.size}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
            className={`transition-all hover:scale-125 ${item.favorite ? 'text-wardrobe-accent-rose' : 'text-ink-600 hover:text-ink-400'}`}
            aria-label="Toggle favorite"
          >
            <Heart className={`w-2.5 h-2.5 ${item.favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Shelf({ label, items, onToggleFavorite, onOpenDetail }: {
  label: string;
  items: WardrobeItem[];
  onToggleFavorite: (id: string) => void;
  onOpenDetail: (item: WardrobeItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div className="px-3 pt-3 pb-2 min-h-[90px]">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-ink-400 font-medium">{label}</span>
          <span className="text-[9px] text-ink-600">({items.length})</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      </div>
      <div className="shelf-board relative h-2 mx-1" />
    </div>
  );
}

function AddItemModal({ collection, onClose, onAdd }: {
  collection: WardrobeCollection;
  onClose: () => void;
  onAdd: (item: WardrobeItem) => void;
}) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(collection.categories[0]?.id ?? '');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('#888888');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [season, setSeason] = useState<Season>('all');
  const [notes, setNotes] = useState('');
  const [imageData, setImageData] = useState<string | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: Date.now().toString(),
      collectionId: collection.id,
      name: name.trim(),
      categoryId,
      color: color.trim() || 'Unknown',
      colorHex,
      brand: brand.trim() || 'Unknown',
      size: size.trim() || 'N/A',
      season,
      notes: notes.trim() || undefined,
      imageData,
      favorite: false,
      inLaundry: false,
      createdAt: Date.now(),
    });
    onClose();
  };

  const inputClass = "w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/60 focus:ring-1 focus:ring-wardrobe-accent-gold/30 transition-all";
  const labelClass = "block text-xs font-medium text-ink-300 mb-1.5 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <h3 className="text-lg font-serif text-ink-50">Add to {collection.name}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PhotoUpload imageData={imageData} onChange={setImageData} label="Photo (optional)" />

          <div>
            <label className={labelClass}>Item Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Linen Blazer" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                {collection.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Season</label>
              <select value={season} onChange={(e) => setSeason(e.target.value as Season)} className={inputClass}>
                {SEASONS.map((s) => <option key={s} value={s}>{SEASON_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Brand</label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} placeholder="e.g. Zara" />
            </div>
            <div>
              <label className={labelClass}>Size</label>
              <input value={size} onChange={(e) => setSize(e.target.value)} className={inputClass} placeholder="e.g. M" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Color</label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => { setColorHex(e.target.value); setColor(e.target.value); }}
                className="w-12 h-10 rounded-lg border border-ink-700 cursor-pointer bg-transparent"
              />
              <input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} placeholder="Color name" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Any details..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:bg-ink-700/50 transition-all">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all">
              Add to Wardrobe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick, small }: {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
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

export default function WardrobeInterior({
  collection, items, allItems, allCollections, looks,
  onAddItem, onEditItem, onToggleFavorite, onDeleteItem,
  onSaveLook, onDeleteLook, onToggleLaundry,
}: WardrobeInteriorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [activeSeasonFilter, setActiveSeasonFilter] = useState<SeasonFilterValue>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Detail / edit / look modals
  const [detailItem, setDetailItem] = useState<WardrobeItem | null>(null);
  const [editItem, setEditItem] = useState<WardrobeItem | null>(null);
  const [lookEditor, setLookEditor] = useState<LookEditorContext | null>(null);
  const [viewingLook, setViewingLook] = useState<Look | null>(null);

  const filteredItems = items.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (activeCategoryId !== 'all' && item.categoryId !== activeCategoryId) return false;
    if (!itemMatchesSeasonFilter(item, activeSeasonFilter)) return false;
    if (showFavoritesOnly && !item.favorite) return false;
    return true;
  });

  const itemsByCategory = (categoryId: string) =>
    filteredItems.filter((item) => item.categoryId === categoryId);

  const shelvesToShow = activeCategoryId === 'all'
    ? collection.categories
    : collection.categories.filter((c) => c.id === activeCategoryId);

  const shownCount = filteredItems.length;
  const totalCount = items.length;

  // Keep detail item in sync with latest data (for favorite toggles etc.)
  const currentDetailItem = detailItem
    ? allItems.find((i) => i.id === detailItem.id) ?? null
    : null;

  return (
    <div className="h-full flex flex-col shelf-wall">
      {/* Top utility shelf */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2.5 bg-gradient-to-b from-black/40 to-transparent border-b border-wardrobe-wood-dark/30">
        <div className="flex gap-1.5 items-center mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${collection.name.toLowerCase()}...`}
              className="w-full bg-ink-900/70 border border-ink-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/50 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-2.5 py-1.5 rounded-lg border transition-all ${
              showFavoritesOnly
                ? 'border-wardrobe-accent-rose/50 bg-wardrobe-accent-rose/15 text-wardrobe-accent-rose'
                : 'border-ink-700/60 text-ink-400 hover:text-ink-200 hover:border-ink-600'
            }`}
            aria-label="Show favorites"
          >
            <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            <FilterChip label="All" active={activeCategoryId === 'all'} onClick={() => setActiveCategoryId('all')} />
            {collection.categories.map((cat) => (
              <FilterChip
                key={cat.id}
                label={cat.label}
                active={activeCategoryId === cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
              />
            ))}
          </div>
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
        </div>

        <div className="flex items-center justify-between text-[10px] text-ink-500 mt-1.5">
          <span>{shownCount} of {totalCount} pieces</span>
        </div>
      </div>

      <div className="shelf-board relative h-2 mx-1 flex-shrink-0" />

      {/* Scrollable shelves */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {shownCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <div className="w-14 h-14 rounded-full bg-ink-800/50 border border-ink-700/50 flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-ink-600" />
            </div>
            <p className="text-ink-400 text-sm">No pieces found</p>
            <p className="text-ink-600 text-xs mt-1">Try adjusting your filters or add a new piece</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {shelvesToShow.map((cat) => {
              const catItems = itemsByCategory(cat.id);
              if (catItems.length === 0) return null;
              return (
                <Shelf
                  key={cat.id}
                  label={cat.label}
                  items={catItems}
                  onToggleFavorite={onToggleFavorite}
                  onOpenDetail={setDetailItem}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="shelf-board relative h-2 mx-1 flex-shrink-0" />

      {showAddModal && (
        <AddItemModal
          collection={collection}
          onClose={() => setShowAddModal(false)}
          onAdd={onAddItem}
        />
      )}

      {/* Item detail modal */}
      {currentDetailItem && (
        <ItemDetailModal
          item={currentDetailItem}
          collection={allCollections.find((c) => c.id === currentDetailItem.collectionId) ?? collection}
          allItems={allItems}
          looks={looks}
          onClose={() => setDetailItem(null)}
          onEdit={() => { setEditItem(currentDetailItem); setDetailItem(null); }}
          onDelete={() => { onDeleteItem(currentDetailItem.id); setDetailItem(null); }}
          onCreateLook={() => { setLookEditor({ primaryItem: currentDetailItem }); setDetailItem(null); }}
          onViewLook={(look) => { setViewingLook(look); setDetailItem(null); }}
          onToggleFavorite={onToggleFavorite}
          onToggleLaundry={onToggleLaundry}
        />
      )}

      {/* Edit item modal */}
      {editItem && (
        <EditItemModal
          item={editItem}
          collection={allCollections.find((c) => c.id === editItem.collectionId) ?? collection}
          onClose={() => setEditItem(null)}
          onSave={(updated) => { onEditItem(updated); setEditItem(null); }}
        />
      )}

      {/* Create look modal */}
      {lookEditor && (
        <CreateLookModal
          key={lookEditor.existingLook?.id ?? `new-${lookEditor.primaryItem.id}`}
          primaryItem={lookEditor.primaryItem}
          existingLook={lookEditor.existingLook}
          allItems={allItems}
          allCollections={allCollections}
          onClose={() => setLookEditor(null)}
          onSave={(look) => { onSaveLook(look); setLookEditor(null); }}
        />
      )}

      {/* Look viewer modal */}
      {viewingLook && (
        <LookViewerModal
          look={viewingLook}
          allItems={allItems}
          allCollections={allCollections}
          onClose={() => setViewingLook(null)}
          onDelete={() => { onDeleteLook(viewingLook.id); setViewingLook(null); }}
          onEdit={() => {
            const primary = allItems.find((i) => i.id === viewingLook.primaryItemId);
            if (primary) {
              setLookEditor({ primaryItem: primary, existingLook: viewingLook });
            }
            setViewingLook(null);
          }}
          onItemClick={(item) => { setViewingLook(null); setDetailItem(item); }}
        />
      )}
    </div>
  );
}
