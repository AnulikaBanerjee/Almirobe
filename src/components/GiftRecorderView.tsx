import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Gift, ImagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import type { GiftDirection, GiftRecord, WardrobeCollection, WardrobeItem } from '@/types';
import { useImageStorage } from '@/images';
import ModalPortal from '@/components/ModalPortal';

interface GiftRecorderViewProps {
  gifts: GiftRecord[];
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  onSaveGift: (gift: GiftRecord) => void;
  onDeleteGift: (id: string) => void;
  onBack: () => void;
}

type GiftEntry = GiftRecord & { wardrobeItem?: WardrobeItem };

function GiftImage({ imageUrl, alt }: { imageUrl?: string; alt: string }) {
  const imageStorage = useImageStorage();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setSrc(null);
      return;
    }
    if (/^(data:|https?:|blob:|\/uploads\/)/.test(imageUrl)) {
      setSrc(imageUrl);
      return;
    }
    let objectUrl: string | null = null;
    void imageStorage.resolveUrl(imageUrl).then((url) => {
      if (url?.startsWith('blob:')) objectUrl = url;
      setSrc(url);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageStorage, imageUrl]);

  return src ? (
    <img src={src} alt={alt} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-700">
      <Gift className="w-7 h-7" />
    </div>
  );
}

function GiftFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: GiftRecord;
  onClose: () => void;
  onSave: (gift: GiftRecord) => Promise<void>;
}) {
  const imageStorage = useImageStorage();
  const [name, setName] = useState(initial?.name ?? '');
  const [direction, setDirection] = useState<GiftDirection>(initial?.direction ?? 'received');
  const [personName, setPersonName] = useState(initial?.personName ?? '');
  const [occasion, setOccasion] = useState(initial?.occasion ?? '');
  const [date, setDate] = useState(
    initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [imageRef, setImageRef] = useState(initial?.imageUrl);
  const [preview, setPreview] = useState<string | undefined>();
  const [file, setFile] = useState<File | undefined>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const inputClass = 'w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:border-amber-500';
  const labelClass = 'block text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wider';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !personName.trim() || !occasion.trim()) {
      setError('Enter the gift, person, and occasion.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let savedImage = imageRef;
      if (file) {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 360 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not prepare the gift thumbnail.');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const thumbnail = canvas.toDataURL('image/jpeg', 0.78);
        savedImage = (await imageStorage.upload(thumbnail)).url;
      }
      await onSave({
        id: initial?.id ?? `gift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        direction,
        personName: personName.trim(),
        occasion: occasion.trim(),
        date: date ? new Date(`${date}T12:00:00`).getTime() : undefined,
        notes: notes.trim() || undefined,
        imageUrl: savedImage,
        createdAt: initial?.createdAt ?? Date.now(),
      });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this gift. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={400}>
      <div className="w-full max-w-md bg-[#fffdf8] border border-amber-200 rounded-2xl shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-ink-800">{initial ? 'Edit Gift' : 'Record a Gift'}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-400 hover:text-ink-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
          <div>
            <label className={labelClass}>Gift</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="What was the gift?" autoFocus />
          </div>
          <div>
            <label className={labelClass}>Direction</label>
            <select value={direction} onChange={(event) => setDirection(event.target.value as GiftDirection)} className={inputClass}>
              <option value="received">I received this</option>
              <option value="given">I gave this</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{direction === 'received' ? 'From' : 'To'}</label>
            <input value={personName} onChange={(event) => setPersonName(event.target.value)} className={inputClass} placeholder="Person's name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Occasion</label>
              <input value={occasion} onChange={(event) => setOccasion(event.target.value)} className={inputClass} placeholder="Birthday, wedding..." />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className={inputClass} placeholder="Any details..." />
          </div>
          <div>
            <label className={labelClass}>Gift photo (optional thumbnail)</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-amber-200 flex-shrink-0">
                {preview ? <img src={preview} alt="Gift preview" className="w-full h-full object-cover" /> : <GiftImage imageUrl={imageRef} alt="Gift" />}
              </div>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 text-xs text-ink-600 cursor-pointer hover:bg-amber-50">
                <ImagePlus className="w-4 h-4" />
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (!selected) return;
                    if (!selected.type.startsWith('image/') || selected.size > 10 * 1024 * 1024) {
                      setError('Choose an image smaller than 10MB.');
                      event.target.value = '';
                      return;
                    }
                    setFile(selected);
                    setPreview(URL.createObjectURL(selected));
                    setImageRef(undefined);
                    setError('');
                  }}
                />
              </label>
              {(preview || imageRef) && (
                <button type="button" onClick={() => { setFile(undefined); setPreview(undefined); setImageRef(undefined); }} className="text-xs text-ink-500 hover:text-red-600">Remove</button>
              )}
            </div>
            <p className="text-[10px] text-ink-400 mt-1">Images are resized and saved as thumbnails.</p>
          </div>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-amber-200 text-sm text-ink-600">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-amber-300 text-sm font-medium text-ink-900 disabled:opacity-50">{saving ? 'Saving…' : 'Save Gift'}</button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}

export default function GiftRecorderView({
  gifts,
  allItems,
  allCollections,
  onSaveGift,
  onDeleteGift,
  onBack,
}: GiftRecorderViewProps) {
  const [query, setQuery] = useState('');
  const [editingGift, setEditingGift] = useState<GiftRecord | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const entries = useMemo<GiftEntry[]>(() => {
    const itemGifts: GiftEntry[] = allItems
      .filter((item) => item.isGift)
      .map((item) => ({
        id: `item-${item.id}`,
        name: item.name,
        direction: 'received',
        personName: item.giftFrom ?? '',
        occasion: item.giftOccasion ?? '',
        imageUrl: item.imageUrl ?? item.imageData,
        createdAt: item.createdAt,
        wardrobeItem: item,
      }));
    return [...gifts, ...itemGifts].sort((a, b) => (b.date ?? b.createdAt) - (a.date ?? a.createdAt));
  }, [allItems, gifts]);

  const filtered = entries.filter((gift) => {
    const search = query.trim().toLocaleLowerCase();
    return !search || [gift.name, gift.personName, gift.occasion]
      .some((value) => value.toLocaleLowerCase().includes(search));
  });

  const save = async (gift: GiftRecord) => onSaveGift(gift);

  return (
    <div className="w-full max-w-3xl">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Wardrobes
      </button>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center"><Gift className="w-5 h-5" /></div>
          <div>
            <h2 className="font-serif text-2xl text-ink-800">Gift Recorder</h2>
            <p className="text-xs text-ink-500">Keep track of gifts received and given.</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-300 text-xs font-medium text-ink-900">
          <Plus className="w-4 h-4" /> Add gift
        </button>
      </div>
      <label className="flex items-center gap-2 rounded-xl bg-white border border-amber-200 px-3 py-2.5 mb-4">
        <Search className="w-4 h-4 text-ink-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 text-sm text-ink-800 placeholder:text-ink-400 bg-transparent outline-none" placeholder="Search by occasion or person..." />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X className="w-4 h-4 text-ink-400" /></button>}
      </label>
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-500 border border-dashed border-amber-300 rounded-xl">
          {entries.length ? 'No gifts match your search.' : 'No gifts recorded yet.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((gift) => {
            const wardrobeName = gift.wardrobeItem
              ? allCollections.find((collection) => collection.id === gift.wardrobeItem?.collectionId)?.name
              : undefined;
            return (
              <article key={gift.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-amber-200/80">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-amber-100 flex-shrink-0">
                  <GiftImage imageUrl={gift.imageUrl} alt={gift.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{gift.name}</p>
                  <p className="flex items-center gap-1 text-xs text-ink-500 mt-0.5">
                    {gift.direction === 'received' ? <ArrowDownLeft className="w-3 h-3 text-emerald-700" /> : <ArrowUpRight className="w-3 h-3 text-rose-700" />}
                    {gift.direction === 'received' ? 'From' : 'To'} {gift.personName || '—'} · {gift.occasion || 'Occasion not set'}
                  </p>
                  <p className="text-[10px] text-ink-400 mt-1">
                    {gift.date ? new Date(gift.date).toLocaleDateString() : 'Date not set'}
                    {wardrobeName ? ` · ${wardrobeName}` : ''}
                    {gift.notes ? ` · ${gift.notes}` : ''}
                  </p>
                </div>
                {!gift.wardrobeItem && (
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditingGift(gift)} aria-label={`Edit ${gift.name}`} className="p-2 text-ink-400 hover:text-ink-800"><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => onDeleteGift(gift.id)} aria-label={`Delete ${gift.name}`} className="p-2 text-ink-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {(showAdd || editingGift) && (
        <GiftFormModal
          initial={editingGift ?? undefined}
          onClose={() => { setShowAdd(false); setEditingGift(null); }}
          onSave={save}
        />
      )}
    </div>
  );
}
