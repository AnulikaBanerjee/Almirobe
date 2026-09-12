import { useState } from 'react';
import { X, Pencil, Trash2, Sparkles, Heart, Calendar, Tag, ShoppingBag, WashingMachine, Shirt, Warehouse, RotateCcw } from 'lucide-react';
import type { LoftBox } from '@/types';
import SendToLoftModal from '@/components/loft/SendToLoftModal';
import ModalPortal from '@/components/ModalPortal';
import { formatCurrency } from '@/reports/purchaseReport';
import { monthsSinceWorn } from '@/reports/wearTracking';
import { getLookMemberIds } from '@/looks';
import type { WardrobeItem, WardrobeCollection, Look } from '@/types';
import { SEASON_LABELS } from '@/types';
import ItemImage from '@/components/ItemImage';

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
  onMarkWorn?: () => void;
  loftBoxes?: LoftBox[];
  loftBoxName?: string;
  onMoveToLoft?: (boxId: string) => void;
  onReturnFromLoft?: () => void;
  onOpenLoft?: () => void;
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
  onMarkWorn,
  loftBoxes = [],
  loftBoxName,
  onMoveToLoft,
  onReturnFromLoft,
  onOpenLoft,
}: ItemDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showLoftPicker, setShowLoftPicker] = useState(false);
  const inLoft = Boolean(item.loftBoxId);

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
    <ModalPortal onBackdropClick={onClose} zIndex={400} backdropClassName="bg-black/80 backdrop-blur-md">
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[min(92vh,820px)] overflow-y-auto custom-scrollbar animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Full-screen image area */}
        <div className="relative w-full aspect-[4/3] bg-ink-900 overflow-hidden rounded-t-2xl">
          <ItemImage item={item} alt={item.name} className="w-full h-full object-contain" />

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

          {(item.purchasePrice || item.purchaseDate || item.wearCount) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {item.purchasePrice != null && (
                <div className="rounded-lg border border-ink-700/50 bg-ink-900/30 p-2">
                  <p className="text-ink-500">Paid</p>
                  <p className="text-ink-200 font-medium">{formatCurrency(item.purchasePrice)}</p>
                </div>
              )}
              {item.purchaseDate != null && (
                <div className="rounded-lg border border-ink-700/50 bg-ink-900/30 p-2">
                  <p className="text-ink-500">Purchased</p>
                  <p className="text-ink-200">{new Date(item.purchaseDate).toLocaleDateString()}</p>
                </div>
              )}
              <div className="rounded-lg border border-ink-700/50 bg-ink-900/30 p-2">
                <p className="text-ink-500">Worn</p>
                <p className="text-ink-200">{item.wearCount ?? 0}× · {monthsSinceWorn(item).toFixed(0)} mo ago</p>
              </div>
            </div>
          )}

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
            <div className="ml-auto flex flex-wrap gap-1.5 justify-end">
              {inLoft && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-900/40 border border-amber-700/40 text-amber-300 text-xs font-medium">
                  <Warehouse className="w-3.5 h-3.5" />
                  In loft{loftBoxName ? `: ${loftBoxName}` : ''}
                </span>
              )}
              {item.inLaundry && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-900/40 border border-sky-700/40 text-sky-300 text-xs font-medium">
                  <WashingMachine className="w-3.5 h-3.5" />
                  In Laundry
                </span>
              )}
            </div>
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
                            <ItemImage item={lookItem} alt="" className="w-full h-full object-cover" />
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
            <div className="grid grid-cols-3 gap-2 pt-2">
              {onMarkWorn && (
                <button
                  onClick={onMarkWorn}
                  className="flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium text-ink-200 bg-ink-900/60 border border-ink-700 hover:border-emerald-500/40 hover:text-emerald-300 transition-all"
                >
                  <Shirt className="w-4 h-4" />
                  Worn today
                </button>
              )}
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
                    : 'text-ink-300 bg-ink-900/60 border border-ink-700 hover:border-sky-500/40 hover:text-sky-300'
                }`}
              >
                <WashingMachine className="w-4 h-4" />
                {item.inLaundry ? 'Clean' : 'Laundry'}
              </button>
              {inLoft && onReturnFromLoft ? (
                <button
                  onClick={onReturnFromLoft}
                  className="flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium text-amber-300 bg-amber-900/20 border border-amber-700/40 hover:bg-amber-900/40 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Unpack
                </button>
              ) : onMoveToLoft ? (
                <button
                  onClick={() => setShowLoftPicker(true)}
                  className="flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium text-ink-300 bg-ink-900/60 border border-ink-700 hover:border-amber-500/40 hover:text-amber-300 transition-all"
                >
                  <Warehouse className="w-4 h-4" />
                  To loft
                </button>
              ) : null}
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

      {showLoftPicker && onMoveToLoft && (
        <SendToLoftModal
          itemName={item.name}
          loftBoxes={loftBoxes}
          onClose={() => setShowLoftPicker(false)}
          onSelectBox={onMoveToLoft}
          onCreateBox={onOpenLoft}
        />
      )}
    </ModalPortal>
  );
}
