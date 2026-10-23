import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { WardrobeItem, WardrobeCollection, Season } from '@/types';
import { DEFAULT_SHELF_COUNT, SEASON_LABELS, SEASONS } from '@/types';
import PhotoUpload from './PhotoUpload';
import ModalPortal from './ModalPortal';
import { useGarmentPhoto } from '@/imageJobs/useGarmentPhoto';
import { persistImageUrl, useImageStorage } from '@/images';
import { pickTag } from '@/imageJobs/tags';
import GarmentCropModal from './GarmentCropModal';
import { colorNameForHex, hexForColorName, titleCaseColor } from '@/colors/namedColors';

interface EditItemModalProps {
  item: WardrobeItem;
  collection: WardrobeCollection;
  onClose: () => void;
  onSave: (item: WardrobeItem) => void;
}

export default function EditItemModal({ item, collection, onClose, onSave }: EditItemModalProps) {
  const imageStorage = useImageStorage();
  const photo = useGarmentPhoto();
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [nameError, setNameError] = useState(false);
  const isShelfMode = (collection.displayMode ?? 'category') === 'shelf';
  const shelfCount = collection.shelfCount ?? DEFAULT_SHELF_COUNT;
  const appliedPhotoTags = useRef(false);

  useEffect(() => {
    const tags = photo.state.tags;
    if (!tags || appliedPhotoTags.current) return;
    appliedPhotoTags.current = true;
    const typeValue = pickTag(tags.productType);
    if (typeValue) setCategoryId(categoryForType(collection, typeValue) || categoryId);
    const colorValue = pickTag(tags.color);
    if (colorValue && (!color || color === 'Unknown')) {
      setColor(titleCaseColor(colorValue));
      const namedHex = hexForColorName(colorValue);
      if (namedHex && (!colorHex || colorHex === '#888888')) setColorHex(namedHex);
    }
    if (tags.colorHex && (!colorHex || colorHex === '#888888')) setColorHex(tags.colorHex);
    if (tags.suggestedName && (!name || name.toLowerCase().includes('item'))) {
      setName(tags.suggestedName);
    }
  }, [photo.state.tags, collection, categoryId, color, colorHex, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    if (saving) return;
    if (photo.state.needsCrop && !photo.state.cropConfirmed) {
      photo.openReview();
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const persisted = await persistImageUrl(
        imageStorage,
        photo.state.previewUrl ?? imageUrl
      );
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
        imageUrl: persisted,
        originalImageUrl: photo.state.originalUrl ?? item.originalImageUrl,
        imageJobId: photo.state.jobId ?? item.imageJobId,
        productType: pickTag(photo.state.tags?.productType) || item.productType,
        subtype: pickTag(photo.state.tags?.subtype) || item.subtype,
        occasion: pickTag(photo.state.tags?.occasion) || item.occasion,
        weather: pickTag(photo.state.tags?.weather) || item.weather,
        imageData: undefined,
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        purchaseDate: purchaseDate ? new Date(purchaseDate).getTime() : undefined,
        shelfIndex: isShelfMode ? shelfIndex : item.shelfIndex ?? 0,
      });
      onClose();
    } catch {
      setSaveError('Could not save the photo. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/60 focus:ring-1 focus:ring-wardrobe-accent-gold/30 transition-all";
  const labelClass = "block text-xs font-medium text-ink-300 mb-1.5 uppercase tracking-wider";
  const previewUrl = photo.state.previewUrl ?? imageUrl ?? item.imageData;

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
          <PhotoUpload
            imageUrl={previewUrl}
            onChange={(url) => {
              if (!url) {
                photo.clear();
                setImageUrl(undefined);
              }
            }}
            onFileSelected={photo.processFile}
            onAdjust={photo.state.cutoutStatus === 'succeeded' ? photo.openReview : undefined}
            needsCrop={photo.state.needsCrop}
            cutoutPending={photo.state.cutoutStatus === 'queued' || photo.state.cutoutStatus === 'running'}
          />
          {photo.state.reviewOpen && previewUrl && (
            <GarmentCropModal
              imageUrl={previewUrl}
              onClose={photo.closeReview}
              onSave={photo.confirmCrop}
            />
          )}
          {photo.state.error && <p className="text-xs text-red-400">{photo.state.error}</p>}

          <div>
            <label className={labelClass}>Item Name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(false);
              }}
              className={`${inputClass} ${nameError ? 'border-red-500/70 ring-1 ring-red-500/40' : ''}`}
              placeholder="e.g. Linen Blazer"
              autoFocus
            />
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
                onChange={(e) => {
                  setColorHex(e.target.value);
                  setColor(colorNameForHex(e.target.value));
                }}
                className="w-12 h-10 rounded-lg border border-ink-700 cursor-pointer bg-transparent"
              />
              <input
                value={color}
                onChange={(e) => {
                  const next = e.target.value;
                  setColor(next);
                  const namedHex = hexForColorName(next);
                  if (namedHex) setColorHex(namedHex);
                }}
                className={inputClass}
                placeholder="Color name"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Any details..." />
          </div>

          {saveError && <p className="text-xs text-red-400">{saveError}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:bg-ink-700/50 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}

function categoryForType(collection: WardrobeCollection, productType: string): string | undefined {
  const map: Record<string, string[]> = {
    shirt: ['tops'],
    't-shirt': ['tops'],
    kurta: ['tops'],
    kurti: ['tops'],
    jacket: ['outerwear', 'tops'],
    sweater: ['outerwear', 'tops'],
    jeans: ['bottoms'],
    'formal-pant': ['bottoms'],
    'half-pant': ['bottoms'],
    skirt: ['bottoms'],
    saree: ['dresses'],
    dress: ['dresses'],
  };
  const wanted = map[productType] ?? [];
  return collection.categories.find((c) => wanted.includes(c.id))?.id;
}
