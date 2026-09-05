import { useState } from 'react';
import { X, Pencil, Trash2, Sparkles, Heart, Calendar, Tag, ShoppingBag, WashingMachine } from 'lucide-react';
import { getLookMemberIds } from '@/looks';
import type { WardrobeItem, WardrobeCollection, Look } from '@/types';
import { SEASON_LABELS } from '@/types';

interface ItemDetailModalProps {
  item: WardrobeItem;
  collection: WardrobeCollection;
  allItems: WardrobeItem[];
  looks: Look[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateLook: () => void;
  onViewLook: (look: Look) => void;
  onToggleFavorite: (id: string) => void;
  onToggleLaundry: (id: string) => void;
}

function findCategoryLabel(collection: WardrobeCollection | undefined, categoryId: string): string {
  return collection?.categories.find((c) => c.id === categoryId)?.label ?? 'Uncategorized';
}

export default function ItemDetailModal({
  item,
  collection,
  allItems,
  looks,
  onClose,
  onEdit,
  onDelete,
  onCreateLook,
  onViewLook,
  onToggleFavorite,
  onToggleLaundry,
}: ItemDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Looks that include this item
  const itemLooks = looks.filter(
    (look) => look.primaryItemId === item.id || look.itemIds.includes(item.id)
  );

  // Other items in looks with this item (for preview)
  const getLookItems = (look: Look): WardrobeItem[] => {
    return getLookMemberIds(look)
      .map((id) => allItems.find((i) => i.id === id))
      .filter((i): i is WardrobeItem => i !== undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Full-screen image area */}
        <div className="relative w-full aspect-[4/3] bg-ink-900 overflow-hidden rounded-t-2xl">
          {item.imageData ? (
            <img src={item.imageData} alt={item.name} className="w-full h-full object-contain" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${item.colorHex} 0%, ${item.colorHex}aa 50%, ${item.colorHex}66 100%)`,
              }}
            >
              <div className="text-center">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-white/20"
                  style={{ backgroundColor: item.colorHex }}
                />
                <p className="text-white/60 text-sm">No photo — showing color</p>
              </div>
            </div>
          )}

          {/* Top bar overlay */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => onToggleFavorite(item.id)}
              className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                item.favorite
                  ? 'bg-wardrobe-accent-rose/30 text-wardrobe-accent-rose border border-wardrobe-accent-rose/40'
                  : 'bg-black/40 text-white/70 hover:text-white border border-white/10'
              }`}
              aria-label="Toggle favorite"
            >
              <Heart className={`w-4 h-4 ${item.favorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-white border border-white/10 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Details section */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-serif text-ink-50 mb-1">{item.name}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-900/60 border border-ink-700/40">
                <Tag className="w-3 h-3" />
                {findCategoryLabel(collection, item.categoryId)}
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-900/60 border border-ink-700/40">
                <ShoppingBag className="w-3 h-3" />
                {item.brand}
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-900/60 border border-ink-700/40">
                <Calendar className="w-3 h-3" />
                {SEASON_LABELS[item.season]}
              </span>
              {item.size !== 'N/A' && (
                <span className="px-2 py-0.5 rounded-full bg-ink-900/60 border border-ink-700/40">
                  Size {item.size}
                </span>
              )}
            </div>
          </div>

          {/* Color swatch + laundry status */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border border-ink-700"
              style={{ backgroundColor: item.colorHex }}
            />
            <div>
              <p className="text-xs text-ink-500 uppercase tracking-wider">Color</p>
              <p className="text-sm text-ink-200">{item.color}</p>
            </div>
            {item.inLaundry && (
              <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-900/40 border border-sky-700/40 text-sky-300 text-xs font-medium">
                <WashingMachine className="w-3.5 h-3.5" />
                In Laundry
              </span>
            )}
          </div>

          {/* Notes */}
          {item.notes && (
            <div>
              <p className="text-xs text-ink-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-ink-300 leading-relaxed">{item.notes}</p>
            </div>
          )}

          {/* Looks featuring this item */}
          {itemLooks.length > 0 && (
            <div>
              <p className="text-xs text-ink-500 uppercase tracking-wider mb-2">
                Looks featuring this item ({itemLooks.length})
              </p>
              <div className="space-y-2">
                {itemLooks.map((look) => {
                  const lookItems = getLookItems(look);
                  return (
                    <button
                      key={look.id}
                      onClick={() => onViewLook(look)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-ink-900/40 border border-ink-700/40 hover:border-wardrobe-accent-gold/40 transition-all text-left group"
                    >
                      <div className="flex -space-x-2">
                        {lookItems.slice(0, 4).map((lookItem) => (
                          <div
                            key={lookItem.id}
                            className="w-8 h-8 rounded-md border-2 border-ink-800 overflow-hidden flex-shrink-0"
                          >
                            {lookItem.imageData ? (
                              <img src={lookItem.imageData} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full" style={{ backgroundColor: lookItem.colorHex }} />
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-ink-200 group-hover:text-ink-50 flex-1">{look.name}</span>
                      <span className="text-[10px] text-ink-500">{lookItems.length} items</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {confirmDelete ? (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:bg-ink-700/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 pt-2">
              <button
                onClick={onEdit}
                className="flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium text-ink-200 bg-ink-900/60 border border-ink-700 hover:border-ink-600 hover:bg-ink-700/50 transition-all"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={onCreateLook}
                className="flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Create Look
              </button>
              <button
                onClick={() => onToggleLaundry(item.id)}
                className={`flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium border transition-all ${
                  item.inLaundry
                    ? 'text-sky-300 bg-sky-900/30 border-sky-700/40 hover:bg-sky-800/40'
                    : 'text-ink-300 bg-ink-900/60 border-ink-700 hover:border-sky-500/40 hover:text-sky-300'
                }`}
              >
                <WashingMachine className="w-4 h-4" />
                {item.inLaundry ? 'Clean' : 'Laundry'}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium text-ink-300 bg-ink-900/60 border border-ink-700 hover:border-red-400/40 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
