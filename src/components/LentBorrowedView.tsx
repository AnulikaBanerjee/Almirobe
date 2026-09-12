import { useState } from 'react';
import { ArrowLeft, ArrowRightLeft, HandCoins, Plus, X } from 'lucide-react';
import type { LentStatus, WardrobeCollection, WardrobeItem } from '@/types';
import ItemImage from '@/components/ItemImage';
import ModalPortal from '@/components/ModalPortal';

interface LentBorrowedViewProps {
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  onUpdateItem: (item: WardrobeItem) => void;
  onClearLent: (id: string) => void;
  onBack: () => void;
}

function findCollectionName(collections: WardrobeCollection[], collectionId: string): string {
  return collections.find((c) => c.id === collectionId)?.name ?? 'Wardrobe';
}

function LentItemCard({
  item,
  collectionName,
  onClear,
}: {
  item: WardrobeItem;
  collectionName: string;
  onClear: () => void;
}) {
  const isLent = item.lentStatus === 'lent';
  return (
    <div className="flex gap-3 p-3 rounded-xl border border-ink-700/50 bg-ink-800/60">
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-ink-700/40">
        <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-100 truncate">{item.name}</p>
        <p className="text-xs text-ink-500">{collectionName} · {item.brand}</p>
        <p className="text-xs text-ink-400 mt-1">
          {isLent ? 'Lent to' : 'Borrowed from'}: <span className="text-ink-200">{item.lentParty ?? '—'}</span>
        </p>
        {item.lentNotes && <p className="text-[10px] text-ink-500 mt-0.5 truncate">{item.lentNotes}</p>}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="text-[10px] px-2 py-1 rounded border border-ink-700 text-ink-500 hover:text-emerald-400 self-start"
      >
        Return
      </button>
    </div>
  );
}

function AddLentModal({
  allItems,
  allCollections,
  onClose,
  onSave,
}: {
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  onClose: () => void;
  onSave: (itemId: string, status: LentStatus, party: string, notes: string) => void;
}) {
  const available = allItems.filter((i) => !i.lentStatus);
  const [itemId, setItemId] = useState(available[0]?.id ?? '');
  const [status, setStatus] = useState<LentStatus>('lent');
  const [party, setParty] = useState('');
  const [notes, setNotes] = useState('');

  const inputClass =
    'w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/60 transition-all';

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={400}>
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-md p-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif text-ink-50">Track Lent / Borrowed</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-200"><X className="w-5 h-5" /></button>
        </div>
        {available.length === 0 ? (
          <p className="text-sm text-ink-400 py-4 text-center">All items are already tracked.</p>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!itemId || !party.trim()) return;
              onSave(itemId, status, party.trim(), notes.trim());
              onClose();
            }}
          >
            <div>
              <label className="text-xs text-ink-400 uppercase tracking-wider">Item</label>
              <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={`${inputClass} mt-1`}>
                {available.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({findCollectionName(allCollections, item.collectionId)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-400 uppercase tracking-wider">Type</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as LentStatus)} className={`${inputClass} mt-1`}>
                <option value="lent">I lent this out</option>
                <option value="borrowed">I borrowed this</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-400 uppercase tracking-wider">
                {status === 'lent' ? 'Lent to' : 'Borrowed from'}
              </label>
              <input value={party} onChange={(e) => setParty(e.target.value)} className={`${inputClass} mt-1`} placeholder="Person's name" />
            </div>
            <div>
              <label className="text-xs text-ink-400 uppercase tracking-wider">Notes (optional)</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} mt-1`} placeholder="Return date, condition..." />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300"
            >
              Save
            </button>
          </form>
        )}
      </div>
    </ModalPortal>
  );
}

export default function LentBorrowedView({
  allItems,
  allCollections,
  onUpdateItem,
  onClearLent,
  onBack,
}: LentBorrowedViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const lentItems = allItems.filter((i) => i.lentStatus === 'lent');
  const borrowedItems = allItems.filter((i) => i.lentStatus === 'borrowed');

  const handleSave = (itemId: string, status: LentStatus, party: string, notes: string) => {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;
    onUpdateItem({
      ...item,
      lentStatus: status,
      lentParty: party,
      lentNotes: notes || undefined,
      lentDate: Date.now(),
    });
  };

  return (
    <div className="w-full max-w-2xl animate-fade-in-up">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Wardrobes
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-ink-50">Lent &amp; Borrowed</h2>
            <p className="text-xs text-ink-400">Track items you've shared or borrowed</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <HandCoins className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-medium text-ink-200">Lent Out ({lentItems.length})</h3>
          </div>
          {lentItems.length === 0 ? (
            <p className="text-xs text-ink-600 py-4 text-center border border-dashed border-ink-700/50 rounded-xl">Nothing lent out</p>
          ) : (
            <div className="space-y-2">
              {lentItems.map((item) => (
                <LentItemCard
                  key={item.id}
                  item={item}
                  collectionName={findCollectionName(allCollections, item.collectionId)}
                  onClear={() => onClearLent(item.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-medium text-ink-200">Borrowed ({borrowedItems.length})</h3>
          </div>
          {borrowedItems.length === 0 ? (
            <p className="text-xs text-ink-600 py-4 text-center border border-dashed border-ink-700/50 rounded-xl">Nothing borrowed</p>
          ) : (
            <div className="space-y-2">
              {borrowedItems.map((item) => (
                <LentItemCard
                  key={item.id}
                  item={item}
                  collectionName={findCollectionName(allCollections, item.collectionId)}
                  onClear={() => onClearLent(item.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showAdd && (
        <AddLentModal
          allItems={allItems}
          allCollections={allCollections}
          onClose={() => setShowAdd(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}
