import { useState } from 'react';
import { X } from 'lucide-react';
import type { WardrobeItem, WardrobeCollection, Season } from '@/types';
import { DEFAULT_SHELF_COUNT, SEASON_LABELS, SEASONS } from '@/types';
import PhotoUpload from './PhotoUpload';
import ModalPortal from './ModalPortal';

interface EditItemModalProps {
  item: WardrobeItem;
  collection: WardrobeCollection;
  onClose: () => void;
  onSave: (item: WardrobeItem) => void;
}

export default function EditItemModal({ item, collection, onClose, onSave }: EditItemModalProps) {
  const [name, setName] = useState(item.name);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [color, setColor] = useState(item.color);
  const [colorHex, setColorHex] = useState(item.colorHex);
  const [brand, setBrand] = useState(item.brand);
  const [size, setSize] = useState(item.size);
  const [season, setSeason] = useState<Season>(item.season);
  const [notes, setNotes] = useState(item.notes ?? '');
  const [imageUrl, setImageUrl] = useState<string | undefined>(item.imageUrl ?? item.imageData);
  const [purchasePrice, setPurchasePrice] = useState(item.purchasePrice?.toString() ?? '');
  const [purchaseDate, setPurchaseDate] = useState(
    item.purchaseDate ? new Date(item.purchaseDate).toISOString().slice(0, 10) : ''
  );
  const [shelfIndex, setShelfIndex] = useState(item.shelfIndex ?? 0);
  const isShelfMode = (collection.displayMode ?? 'category') === 'shelf';
  const shelfCount = collection.shelfCount ?? DEFAULT_SHELF_COUNT;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...item,
      name: name.trim(),
      categoryId,
      color: color.trim() || 'Unknown',
      colorHex,
      brand: brand.trim() || 'Unknown',
      size: size.trim() || 'N/A',
      season,
      notes: notes.trim() || undefined,
      imageUrl,
      imageData: undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate).getTime() : undefined,
      shelfIndex: isShelfMode ? shelfIndex : item.shelfIndex ?? 0,
    });
    onClose();
  };

  const inputClass = "w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/60 focus:ring-1 focus:ring-wardrobe-accent-gold/30 transition-all";
  const labelClass = "block text-xs font-medium text-ink-300 mb-1.5 uppercase tracking-wider";

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={400}>
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[min(90vh,820px)] overflow-y-auto custom-scrollbar animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <h3 className="text-lg font-serif text-ink-50">Edit Item</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PhotoUpload imageUrl={imageUrl} imageData={item.imageData} onChange={setImageUrl} />

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
            {(collection.enableSeasonFilter ?? true) ? (
              <div>
                <label className={labelClass}>Season</label>
                <select value={season} onChange={(e) => setSeason(e.target.value as Season)} className={inputClass}>
                  {SEASONS.map((s) => <option key={s} value={s}>{SEASON_LABELS[s]}</option>)}
                </select>
              </div>
            ) : (
              <div />
            )}
          </div>

          {isShelfMode && (
            <div>
              <label className={labelClass}>Shelf</label>
              <select value={shelfIndex} onChange={(e) => setShelfIndex(Number(e.target.value))} className={inputClass}>
                {Array.from({ length: shelfCount }, (_, i) => (
                  <option key={i} value={i}>Shelf {i + 1}</option>
                ))}
              </select>
            </div>
          )}

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Purchase price (optional)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className={inputClass}
                placeholder="e.g. 49"
              />
            </div>
            <div>
              <label className={labelClass}>Purchase date (optional)</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className={inputClass}
              />
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}
