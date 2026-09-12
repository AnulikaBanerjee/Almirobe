import { useState } from 'react';
import { X, Plus, Check, Search, Sparkles } from 'lucide-react';
import { buildLookFromDraft } from '@/looks';
import type { WardrobeItem, WardrobeCollection, Look } from '@/types';
import ItemImage from '@/components/ItemImage';
import ModalPortal from '@/components/ModalPortal';

interface CreateLookModalProps {
  primaryItem: WardrobeItem;
  existingLook?: Look;
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  onClose: () => void;
  onSave: (look: Look) => void;
}

function findCollection(collections: WardrobeCollection[], collectionId: string): WardrobeCollection | undefined {
  return collections.find((c) => c.id === collectionId);
}

function findCategoryLabel(collection: WardrobeCollection | undefined, categoryId: string): string {
  return collection?.categories.find((c) => c.id === categoryId)?.label ?? 'Uncategorized';
}

function ItemThumbnail({ item, size = 'md' }: { item: WardrobeItem; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';
  return (
    <div className={`${sizeClass} rounded-lg overflow-hidden border border-ink-700 flex-shrink-0 relative`}>
      <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
    </div>
  );
}

export default function CreateLookModal({
  primaryItem,
  existingLook,
  allItems,
  allCollections,
  onClose,
  onSave,
}: CreateLookModalProps) {
  const isEditing = Boolean(existingLook);
  const [lookName, setLookName] = useState(existingLook?.name ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>(existingLook?.itemIds ?? []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCollectionId, setActiveCollectionId] = useState<string>('all');

  const toggleItem = (id: string) => {
    if (id === primaryItem.id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const availableItems = allItems.filter((item) => {
    if (item.id === primaryItem.id) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.brand.toLowerCase().includes(q)) return false;
    }
    if (activeCollectionId !== 'all' && item.collectionId !== activeCollectionId) return false;
    return true;
  });

  const selectedItems = allItems.filter((item) => selectedIds.includes(item.id));
  const allLookItems = [primaryItem, ...selectedItems];

  const handleSave = () => {
    const name = lookName.trim() || `${primaryItem.name} Look`;
    onSave(
      buildLookFromDraft({
        primaryItemId: primaryItem.id,
        itemIds: selectedIds,
        name,
        existingLook,
        notes: existingLook?.notes,
      })
    );
    onClose();
  };

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={400}>
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[min(92vh,820px)] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-wardrobe-accent-gold" />
            <h3 className="text-lg font-serif text-ink-50">{isEditing ? 'Edit Look' : 'Create a Look'}</h3>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Look preview — assembled items */}
          <div className="p-5 bg-gradient-to-b from-ink-900/40 to-transparent border-b border-ink-700/40">
            <input
              value={lookName}
              onChange={(e) => setLookName(e.target.value)}
              placeholder="Name your look (e.g. Weekend Brunch)"
              className="w-full bg-transparent text-lg font-serif text-ink-50 placeholder-ink-600 focus:outline-none mb-3"
              autoFocus
            />
            <div className="flex items-center gap-2 flex-wrap">
              {allLookItems.map((item) => {
                const collection = findCollection(allCollections, item.collectionId);
                return (
                  <div key={item.id} className="relative group">
                    <ItemThumbnail item={item} size="md" />
                    <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-1">
                      <span className="text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity truncate w-full text-center">
                        {findCategoryLabel(collection, item.categoryId)}
                      </span>
                    </div>
                    {item.id !== primaryItem.id && (
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {item.id === primaryItem.id && (
                      <div className="absolute -top-1.5 -right-1.5 px-1.5 h-5 rounded-full bg-wardrobe-accent-gold text-ink-900 text-[8px] font-bold flex items-center justify-center">
                        MAIN
                      </div>
                    )}
                  </div>
                );
              })}
              {selectedItems.length === 0 && (
                <div className="text-sm text-ink-500 italic pl-2">
                  Add items below to build your look...
                </div>
              )}
            </div>
          </div>

          {/* Search and filter */}
          <div className="px-5 pt-4 pb-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items to add..."
                className="w-full bg-ink-900/70 border border-ink-700/60 rounded-lg pl-9 pr-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/50 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveCollectionId('all')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  activeCollectionId === 'all'
                    ? 'bg-wardrobe-accent-gold/20 text-wardrobe-accent-gold border border-wardrobe-accent-gold/40'
                    : 'bg-ink-900/50 text-ink-400 border border-ink-700/40 hover:text-ink-300'
                }`}
              >
                All Wardrobes
              </button>
              {allCollections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCollectionId(c.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    activeCollectionId === c.id
                      ? 'bg-wardrobe-accent-gold/20 text-wardrobe-accent-gold border border-wardrobe-accent-gold/40'
                      : 'bg-ink-900/50 text-ink-400 border border-ink-700/40 hover:text-ink-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Item picker grid */}
          <div className="px-5 pb-5">
            {availableItems.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-ink-400 text-sm">No items found</p>
                <p className="text-ink-600 text-xs mt-1">Try a different search or wardrobe</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {availableItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const collection = findCollection(allCollections, item.collectionId);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-wardrobe-accent-gold shadow-lg shadow-wardrobe-accent-gold/20'
                          : 'border-ink-700/40 hover:border-ink-600'
                      }`}
                    >
                      <div className="aspect-square relative">
                        <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-wardrobe-accent-gold/20 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-wardrobe-accent-gold text-ink-900 flex items-center justify-center">
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                        {!isSelected && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                            <Plus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                      <div className="p-1.5 bg-ink-800">
                        <p className="text-[9px] text-ink-200 truncate leading-tight">{item.name}</p>
                        <p className="text-[8px] text-ink-500 truncate">{findCategoryLabel(collection, item.categoryId)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 p-5 border-t border-ink-700 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:bg-ink-700/50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            {isEditing ? 'Save Changes' : 'Save Look'} ({allLookItems.length} items)
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
