import { useMemo, useState } from 'react';
import { ArrowLeft, Box, Pencil, Plus, RotateCcw, Trash2, Warehouse } from 'lucide-react';
import type { LoftBox, Look, WardrobeCollection, WardrobeItem } from '@/types';
import AppPageShell from '@/components/pages/AppPageShell';
import LoftBoxThumbnail from '@/components/loft/LoftBoxThumbnail';
import LoftBoxFormModal from '@/components/loft/LoftBoxFormModal';
import AddToLoftBoxModal from '@/components/loft/AddToLoftBoxModal';
import ItemDetailModal from '@/components/ItemDetailModal';
import EditItemModal from '@/components/EditItemModal';
import ItemImage from '@/components/ItemImage';
import { getItemLocationSummary } from '@/items/itemLocation';
import { markItemWornToday } from '@/reports/wearTracking';

interface LoftPageProps {
  loftBoxes: LoftBox[];
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  looks: Look[];
  giftRecorderEnabled: boolean;
  onBack: () => void;
  onSaveBox: (box: LoftBox) => void;
  onDeleteBox: (boxId: string) => void;
  onMoveToLoft: (itemIds: string[], boxId: string) => void;
  onReturnFromLoft: (itemIds: string[]) => void;
  onEditItem: (item: WardrobeItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleLaundry: (id: string) => void;
  onCreateLook: (item: WardrobeItem) => void;
  onViewLook: (look: Look) => void;
}

export default function LoftPage({
  loftBoxes,
  items,
  collections,
  onBack,
  onSaveBox,
  onDeleteBox,
  onMoveToLoft,
  onReturnFromLoft,
  looks,
  giftRecorderEnabled,
  onEditItem,
  onDeleteItem,
  onToggleFavorite,
  onToggleLaundry,
  onCreateLook,
  onViewLook,
}: LoftPageProps) {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [boxForm, setBoxForm] = useState<'create' | { edit: LoftBox } | null>(null);
  const [showAddItems, setShowAddItems] = useState(false);
  const [confirmDeleteBox, setConfirmDeleteBox] = useState(false);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<WardrobeItem | null>(null);

  const detailItem = detailItemId ? items.find((i) => i.id === detailItemId) ?? null : null;

  const sortedBoxes = useMemo(
    () => [...loftBoxes].sort((a, b) => b.createdAt - a.createdAt),
    [loftBoxes]
  );

  const selectedBox = selectedBoxId ? loftBoxes.find((b) => b.id === selectedBoxId) : null;

  const boxItems = useMemo(() => {
    if (!selectedBoxId) return [];
    return items
      .filter((item) => item.loftBoxId === selectedBoxId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [items, selectedBoxId]);

  const itemCountByBox = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (item.loftBoxId) {
        counts[item.loftBoxId] = (counts[item.loftBoxId] ?? 0) + 1;
      }
    }
    return counts;
  }, [items]);

  if (selectedBox) {
    return (
      <div className="w-full max-w-3xl animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              setSelectedBoxId(null);
              setConfirmDeleteBox(false);
            }}
            className="w-9 h-9 rounded-full border border-ink-700 bg-ink-800/60 text-ink-400 hover:text-ink-100 hover:border-ink-600 transition-all flex items-center justify-center flex-shrink-0"
            aria-label="Back to loft boxes"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-amber-800/40 shadow-lg">
              <LoftBoxThumbnail box={selectedBox} className="w-full h-full" iconClassName="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-serif text-ink-50 truncate">{selectedBox.name}</h2>
              <p className="text-xs text-ink-400">
                {boxItems.length} piece{boxItems.length === 1 ? '' : 's'}
                {selectedBox.notes ? ` · ${selectedBox.notes}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBoxForm({ edit: selectedBox })}
            className="w-9 h-9 rounded-lg border border-ink-700 text-ink-400 hover:text-ink-200 flex items-center justify-center"
            aria-label="Edit box"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-ink-700/50 bg-ink-800/40 p-5 sm:p-6 space-y-4">
          <button
            type="button"
            onClick={() => setShowAddItems(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300"
          >
            <Plus className="w-4 h-4" />
            Add clothes from wardrobe
          </button>

          {boxItems.length === 0 ? (
            <div className="text-center py-10">
              <Box className="w-10 h-10 text-amber-700/50 mx-auto mb-2" />
              <p className="text-sm text-ink-400">This box is empty</p>
              <p className="text-xs text-ink-600 mt-1">Pack away out-of-season pieces from your wardrobes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {boxItems.map((item) => {
                const { wardrobe, placement } = getItemLocationSummary(item, collections);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-ink-700/50 bg-ink-900/30"
                  >
                    <button
                      type="button"
                      onClick={() => setDetailItemId(item.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-90 transition-opacity"
                    >
                      <div className="w-12 h-14 rounded-lg overflow-hidden border border-ink-700/50 flex-shrink-0">
                        <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-100 truncate">{item.name}</p>
                        <p className="text-xs text-ink-500 truncate">{item.brand}</p>
                        <p className="text-xs text-amber-500/90 mt-0.5">{wardrobe} · {placement}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onReturnFromLoft([item.id])}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-300 border border-ink-700 hover:border-amber-600/50 hover:text-amber-300 transition-all flex-shrink-0"
                      title="Return to wardrobe"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Unpack</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-ink-700/50">
            {confirmDeleteBox ? (
              <div className="space-y-2">
                <p className="text-xs text-amber-300/90 text-center">
                  Delete this box? {boxItems.length > 0 && `${boxItems.length} piece(s) will return to the wardrobe.`}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteBox(false)}
                    className="flex-1 py-2 rounded-lg text-sm text-ink-300 border border-ink-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteBox(selectedBox.id);
                      setSelectedBoxId(null);
                      setConfirmDeleteBox(false);
                    }}
                    className="flex-1 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-500"
                  >
                    Delete box
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteBox(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-ink-500 hover:text-red-400 border border-transparent hover:border-red-400/30 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete box
              </button>
            )}
          </div>
        </div>

        {boxForm && (
          <LoftBoxFormModal
            mode={boxForm === 'create' ? 'create' : 'edit'}
            box={boxForm === 'create' ? undefined : boxForm.edit}
            onClose={() => setBoxForm(null)}
            onSave={onSaveBox}
          />
        )}

        {showAddItems && (
          <AddToLoftBoxModal
            boxName={selectedBox.name}
            items={items}
            collections={collections}
            onClose={() => setShowAddItems(false)}
            onAdd={(ids) => onMoveToLoft(ids, selectedBox.id)}
          />
        )}

        {detailItem && (
          <ItemDetailModal
            item={detailItem}
            collection={collections.find((c) => c.id === detailItem.collectionId) ?? collections[0]}
            allItems={items}
            looks={looks}
            onClose={() => setDetailItemId(null)}
            onEdit={() => { setEditItem(detailItem); setDetailItemId(null); }}
            onDelete={() => { onDeleteItem(detailItem.id); setDetailItemId(null); }}
            onCreateLook={() => { onCreateLook(detailItem); setDetailItemId(null); }}
            onViewLook={(look) => { onViewLook(look); setDetailItemId(null); }}
            onToggleFavorite={onToggleFavorite}
            onToggleLaundry={onToggleLaundry}
            onMarkWorn={() => onEditItem(markItemWornToday(detailItem))}
            loftBoxes={loftBoxes}
            loftBoxName={loftBoxes.find((b) => b.id === detailItem.loftBoxId)?.name}
            onReturnFromLoft={() => {
              onReturnFromLoft([detailItem.id]);
              setDetailItemId(null);
            }}
          />
        )}

        {editItem && (
          <EditItemModal
            item={editItem}
            collection={collections.find((c) => c.id === editItem.collectionId) ?? collections[0]}
            onClose={() => setEditItem(null)}
            onSave={(updated) => { onEditItem(updated); setEditItem(null); }}
            giftRecorderEnabled={giftRecorderEnabled}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <AppPageShell
        title="The Loft"
        subtitle="Out-of-season bags and boxes tucked away upstairs"
        icon={Warehouse}
        iconClassName="text-amber-500"
        onBack={onBack}
        wide
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setBoxForm('create')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300"
          >
            <Plus className="w-4 h-4" />
            New box / bag
          </button>

          {sortedBoxes.length === 0 ? (
            <div className="text-center py-12">
              <Warehouse className="w-12 h-12 text-amber-700/40 mx-auto mb-3" />
              <p className="text-sm text-ink-400">No boxes in the loft yet</p>
              <p className="text-xs text-ink-600 mt-1 max-w-xs mx-auto">
                Create a box, add a photo of the physical bag, then pack away seasonal clothes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {sortedBoxes.map((box) => (
                <button
                  key={box.id}
                  type="button"
                  onClick={() => setSelectedBoxId(box.id)}
                  className="group text-left rounded-xl border border-ink-700/50 bg-ink-900/30 overflow-hidden hover:border-amber-600/40 hover:bg-ink-900/50 transition-all hover:shadow-lg hover:shadow-amber-900/10"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <LoftBoxThumbnail
                      box={box}
                      className="w-full h-full transition-transform group-hover:scale-105"
                      iconClassName="w-12 h-12"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-2 left-2 right-2 text-xs font-medium text-ink-50 truncate drop-shadow">
                      {box.name}
                    </span>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-[11px] text-ink-500">
                      {itemCountByBox[box.id] ?? 0} piece{(itemCountByBox[box.id] ?? 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </AppPageShell>

      {boxForm && (
        <LoftBoxFormModal
          mode={boxForm === 'create' ? 'create' : 'edit'}
          box={boxForm === 'create' ? undefined : boxForm.edit}
          onClose={() => setBoxForm(null)}
          onSave={(box) => {
            onSaveBox(box);
            if (boxForm === 'create') {
              setSelectedBoxId(box.id);
            }
          }}
        />
      )}
    </>
  );
}
