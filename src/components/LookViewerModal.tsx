import { useState } from 'react';
import { X, Trash2, Pencil, Heart } from 'lucide-react';
import { getLookMemberIds } from '@/looks';
import type { WardrobeItem, WardrobeCollection, Look } from '@/types';
import { SEASON_LABELS } from '@/types';
import ItemImage from '@/components/ItemImage';
import ModalPortal from '@/components/ModalPortal';

interface LookViewerModalProps {
  look: Look;
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onItemClick: (item: WardrobeItem) => void;
}

function findCollection(collections: WardrobeCollection[], collectionId: string): WardrobeCollection | undefined {
  return collections.find((c) => c.id === collectionId);
}

function findCategoryLabel(collection: WardrobeCollection | undefined, categoryId: string): string {
  return collection?.categories.find((c) => c.id === categoryId)?.label ?? 'Uncategorized';
}

export default function LookViewerModal({
  look,
  allItems,
  allCollections,
  onClose,
  onDelete,
  onEdit,
  onItemClick,
}: LookViewerModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const lookItems = getLookMemberIds(look)
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is WardrobeItem => i !== undefined);

  const primaryItem = lookItems[0];
  const otherItems = lookItems.slice(1);

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={400} backdropClassName="bg-black/80 backdrop-blur-md">
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[min(92vh,820px)] overflow-y-auto custom-scrollbar animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with look name */}
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <div>
            <h2 className="text-xl font-serif text-ink-50">{look.name}</h2>
            <p className="text-xs text-ink-500 mt-0.5">{lookItems.length} items in this look</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Primary item — large display */}
          {primaryItem && (
            <div>
              <p className="text-xs text-ink-500 uppercase tracking-wider mb-2">Main Piece</p>
              <button
                onClick={() => onItemClick(primaryItem)}
                className="w-full flex gap-4 p-3 rounded-xl bg-ink-900/40 border border-ink-700/40 hover:border-wardrobe-accent-gold/40 transition-all text-left group"
              >
                <div className="w-28 h-28 rounded-lg overflow-hidden border border-ink-700 flex-shrink-0">
                  <ItemImage item={primaryItem} alt={primaryItem.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-ink-100 group-hover:text-ink-50 transition-colors">{primaryItem.name}</h3>
                  <p className="text-sm text-ink-400 mt-0.5">{primaryItem.brand}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-800 border border-ink-700/40 text-ink-400">
                      {findCategoryLabel(findCollection(allCollections, primaryItem.collectionId), primaryItem.categoryId)}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-800 border border-ink-700/40 text-ink-400">
                      {SEASON_LABELS[primaryItem.season]}
                    </span>
                    {primaryItem.favorite && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-wardrobe-accent-rose/15 border border-wardrobe-accent-rose/30 text-wardrobe-accent-rose flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5 fill-current" />
                        Favorite
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Other items in the look */}
          {otherItems.length > 0 && (
            <div>
              <p className="text-xs text-ink-500 uppercase tracking-wider mb-2">Paired With</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {otherItems.map((item) => {
                  const collection = findCollection(allCollections, item.collectionId);
                  return (
                    <button
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className="group rounded-lg overflow-hidden border border-ink-700/40 hover:border-wardrobe-accent-gold/40 transition-all text-left"
                    >
                      <div className="aspect-square relative">
                        <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 bg-ink-800">
                        <p className="text-xs text-ink-200 truncate">{item.name}</p>
                        <p className="text-[10px] text-ink-500 truncate">{findCategoryLabel(collection, item.categoryId)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {look.notes && (
            <div>
              <p className="text-xs text-ink-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-ink-300 leading-relaxed">{look.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-ink-700">
          {confirmDelete ? (
            <div className="flex gap-2">
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
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onEdit}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-ink-200 bg-ink-900/60 border border-ink-700 hover:border-ink-600 transition-all"
              >
                <Pencil className="w-4 h-4" />
                Edit Look
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-ink-300 bg-ink-900/60 border border-ink-700 hover:border-red-400/40 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete Look
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
