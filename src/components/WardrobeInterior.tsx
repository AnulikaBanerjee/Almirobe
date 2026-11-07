import { useEffect, useRef, useState } from 'react';
import { Search, Plus, Heart, X, Star, WashingMachine, Package, Mic, Maximize2 } from 'lucide-react';
import ItemDragOverlay from '@/components/itemDrag/ItemDragOverlay';
import { useItemDrag } from '@/components/itemDrag/useItemDrag';
import type { LoftBox, WardrobeItem, WardrobeCollection, Season, Look } from '@/types';
import type { LookEditorContext } from '@/looks';
import {
  ALL_SEASONS_FILTER_LABEL,
  itemMatchesSeasonFilter,
  SEASON_FILTER_OPTIONS,
  seasonFilterChipLabel,
  type SeasonFilterValue,
} from '@/filters';
import { markItemWornToday } from '@/reports/wearTracking';
import { DEFAULT_SHELF_COUNT, SEASON_LABELS, SEASONS } from '@/types';
import PhotoUpload from './PhotoUpload';
import ModalPortal from './ModalPortal';
import ItemImage from './ItemImage';
import ItemDetailModal from './ItemDetailModal';
import EditItemModal from './EditItemModal';
import LookViewerModal from './LookViewerModal';
import GarmentCropModal from './GarmentCropModal';
import { useGarmentPhoto } from '@/imageJobs/useGarmentPhoto';
import { pickTag } from '@/imageJobs/tags';
import { getStoredUiLocale, setStoredUiLocale, t, UI_LOCALES, type UiLocale } from '@/i18n/addItem';
import { useSpeechToText } from '@/voice/useSpeechToText';
import { parseUtterance } from '@/voice/parseUtterance';
import { colorNameForHex, hexForColorName, titleCaseColor } from '@/colors/namedColors';
import { apiClient } from '@/api/client';
import { useAuthSession } from '@/auth/AuthSessionContext';
import type { TagCatalog } from '@/api/types';
import fallbackCatalog from '@/catalog/tags.json';
import { persistImageUrl, useImageStorage } from '@/images';

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
  loftBoxes: LoftBox[];
  onMoveToLoft: (itemIds: string[], boxId: string) => void;
  onReturnFromLoft: (itemIds: string[]) => void;
  onOpenLoft: () => void;
  onOpenCreateLook: (ctx: LookEditorContext) => void;
  giftRecorderEnabled: boolean;
}

function ItemCard({
  item,
  isDragging,
  onToggleFavorite,
  onItemPointerDown,
  onItemPointerMove,
  onItemPointerUp,
  onItemPointerCancel,
}: {
  item: WardrobeItem;
  isDragging: boolean;
  onToggleFavorite: (id: string) => void;
  onItemPointerDown: (e: React.PointerEvent, item: WardrobeItem) => void;
  onItemPointerMove: (e: React.PointerEvent) => void;
  onItemPointerUp: (e: React.PointerEvent) => void;
  onItemPointerCancel: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      className={`group relative flex flex-col items-center animate-fade-in-up touch-none select-none ${
        isDragging ? 'opacity-30 scale-95' : 'cursor-grab active:cursor-grabbing'
      }`}
      style={{ animationDelay: '0.05s' }}
      onPointerDown={(e) => onItemPointerDown(e, item)}
      onPointerMove={onItemPointerMove}
      onPointerUp={onItemPointerUp}
      onPointerCancel={onItemPointerCancel}
    >
      <div className="relative w-full flex flex-col items-center">
        <div className="relative w-full h-24 sm:h-28 flex items-end justify-center transition-transform group-hover:scale-[1.04]">
          <ItemImage
            item={item}
            alt={item.name}
            className="garment-cutout max-h-full max-w-full w-auto h-full object-contain pointer-events-none"
          />
          {item.favorite && (
            <Star className="absolute top-0 right-1 w-3 h-3 text-wardrobe-accent-gold fill-wardrobe-accent-gold drop-shadow pointer-events-none" />
          )}
          {item.inLaundry && (
            <WashingMachine className="absolute top-0 left-1 w-3 h-3 text-sky-500 drop-shadow pointer-events-none" />
          )}
          {item.markedForDonation && (
            <Package className="absolute bottom-0 left-1 w-3 h-3 text-emerald-500 drop-shadow pointer-events-none" />
          )}
        </div>
      </div>

      <div className="mt-1.5 text-center w-full px-0.5 pointer-events-none">
        <p className="text-[10px] font-medium text-ink-700 leading-tight truncate group-hover:text-ink-900 transition-colors">{item.name}</p>
        <p className="text-[9px] text-ink-400 truncate">{item.brand}</p>
        <div className="flex items-center justify-center gap-1.5 mt-0.5 pointer-events-auto">
          <span className="text-[8px] text-ink-400">{item.size}</span>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
            className={`transition-all hover:scale-125 ${item.favorite ? 'text-wardrobe-accent-rose' : 'text-ink-300 hover:text-ink-500'}`}
            aria-label="Toggle favorite"
          >
            <Heart className={`w-2.5 h-2.5 ${item.favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Shelf({
  label,
  items,
  draggingItemId,
  onToggleFavorite,
  onItemPointerDown,
  onItemPointerMove,
  onItemPointerUp,
  onItemPointerCancel,
}: {
  label: string;
  items: WardrobeItem[];
  draggingItemId: string | null;
  onToggleFavorite: (id: string) => void;
  onItemPointerDown: (e: React.PointerEvent, item: WardrobeItem) => void;
  onItemPointerMove: (e: React.PointerEvent) => void;
  onItemPointerUp: (e: React.PointerEvent) => void;
  onItemPointerCancel: (e: React.PointerEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;

  const renderCard = (item: WardrobeItem) => (
    <ItemCard
      key={item.id}
      item={item}
      isDragging={draggingItemId === item.id}
      onToggleFavorite={onToggleFavorite}
      onItemPointerDown={onItemPointerDown}
      onItemPointerMove={onItemPointerMove}
      onItemPointerUp={onItemPointerUp}
      onItemPointerCancel={onItemPointerCancel}
    />
  );

  return (
    <>
      <div className="relative">
        <div className="px-3 pt-3 pb-2 min-h-[100px]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-ink-500 font-medium truncate">{label}</span>
              <span className="text-[9px] text-ink-400 flex-shrink-0">({items.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-ink-500 hover:text-wardrobe-accent-gold border border-ink-300/60 rounded-md px-2 py-0.5 bg-white/40"
              aria-label={`Expand ${label}`}
            >
              <Maximize2 className="w-3 h-3" />
              Expand
            </button>
          </div>
          <div className="shelf-items-scroll custom-scrollbar pr-1">
            {items.map((item) => renderCard(item))}
          </div>
        </div>
        <div className="shelf-board relative h-2 mx-1" />
      </div>

      {expanded && (
        <ModalPortal onBackdropClick={() => setExpanded(false)} zIndex={450} backdropClassName="bg-black/55 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl max-h-[min(85vh,720px)] flex flex-col bg-[#fffdf8] border border-amber-200/80 rounded-2xl shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200/70">
              <h4 className="font-serif text-lg text-ink-800">{label}</h4>
              <button type="button" onClick={() => setExpanded(false)} className="text-ink-400 hover:text-ink-700" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {items.map((item) => renderCard(item))}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}

function weatherToSeason(weather?: string): Season {
  if (weather === 'winter') return 'winter';
  if (weather === 'summer' || weather === 'monsoon') return 'summer';
  return 'all';
}

function categoryForProductType(collection: WardrobeCollection, productType?: string): string {
  const fallback = collection.categories[0]?.id ?? '';
  if (!productType) return fallback;
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
    shoes: ['sneakers', 'boots', 'flats'],
    sandals: ['sandals'],
    heels: ['heels'],
    sneakers: ['sneakers'],
    jewellery: ['necklaces', 'rings', 'earrings', 'bracelets'],
  };
  const wanted = map[productType] ?? [];
  const match = collection.categories.find(
    (c) => wanted.includes(c.id) || c.label.toLowerCase().includes(productType.replace('-', ' '))
  );
  return match?.id ?? fallback;
}

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) return null;
  const labelClass = 'block text-xs font-medium text-ink-300 mb-1.5 uppercase tracking-wider';
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value === value ? '' : option.value)}
            className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${
              value === option.value
                ? 'bg-wardrobe-accent-gold/20 text-amber-100 border-wardrobe-accent-gold/50'
                : 'bg-ink-900/50 text-ink-400 border-ink-700 hover:border-wardrobe-accent-gold/40'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AddItemModal({ collection, onClose, onAdd, giftRecorderEnabled }: {
  collection: WardrobeCollection;
  onClose: () => void;
  onAdd: (item: WardrobeItem) => void;
  giftRecorderEnabled: boolean;
}) {
  const { authProvider } = useAuthSession();
  const imageStorage = useImageStorage();
  const photo = useGarmentPhoto();
  const [locale, setLocale] = useState<UiLocale>(getStoredUiLocale);
  const speech = useSpeechToText(locale);
  const [catalog, setCatalog] = useState<TagCatalog>(fallbackCatalog as TagCatalog);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(collection.categories[0]?.id ?? '');
  const [productType, setProductType] = useState('');
  const [subtype, setSubtype] = useState('');
  const [occasion, setOccasion] = useState('');
  const [weather, setWeather] = useState('');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('#888888');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [season, setSeason] = useState<Season>('all');
  const [notes, setNotes] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftFrom, setGiftFrom] = useState('');
  const [giftOccasion, setGiftOccasion] = useState('');
  const [shelfIndex, setShelfIndex] = useState(0);
  const isShelfMode = (collection.displayMode ?? 'category') === 'shelf';
  const shelfCount = collection.shelfCount ?? DEFAULT_SHELF_COUNT;
  const autoFilledName = useRef(false);
  const [understood, setUnderstood] = useState('');
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    if (authProvider.id !== 'api') return;
    void apiClient.getCatalogTags().then(setCatalog).catch(() => undefined);
  }, [authProvider.id]);

  useEffect(() => {
    const tags = photo.state.tags;
    if (!tags) return;
    const typeValue = pickTag(tags.productType);
    if (typeValue && !productType) {
      setProductType(typeValue);
      setCategoryId(categoryForProductType(collection, typeValue));
    }
    const sub = pickTag(tags.subtype);
    if (sub && !subtype) setSubtype(sub);
    const occ = pickTag(tags.occasion);
    if (occ && !occasion) setOccasion(occ);
    const w = pickTag(tags.weather);
    if (w && !weather) {
      setWeather(w);
      setSeason(weatherToSeason(w));
    }
    if (tags.colorHex && colorHex === '#888888') setColorHex(tags.colorHex);
    const colorValue = pickTag(tags.color);
    if (colorValue && !color) {
      setColor(titleCaseColor(colorValue));
      const namedHex = hexForColorName(colorValue);
      if (namedHex && colorHex === '#888888') setColorHex(namedHex);
    }
    if (tags.suggestedName && !name && !autoFilledName.current) {
      setName(tags.suggestedName);
      autoFilledName.current = true;
    }
  }, [photo.state.tags, collection, productType, subtype, occasion, weather, color, colorHex, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    if (photo.state.needsCrop && !photo.state.cropConfirmed) {
      photo.openReview();
      return;
    }
    const persisted = await persistImageUrl(imageStorage, photo.state.previewUrl);
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
      imageUrl: persisted,
      originalImageUrl: photo.state.originalUrl,
      imageJobId: photo.state.jobId,
      productType: productType || undefined,
      subtype: subtype || undefined,
      occasion: occasion || undefined,
      weather: weather || undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate).getTime() : undefined,
      shelfIndex: isShelfMode ? shelfIndex : 0,
      favorite: false,
      inLaundry: false,
      markedForDonation: false,
      loftBoxId: null,
      lentStatus: null,
      isGift: giftRecorderEnabled && isGift,
      giftFrom: giftRecorderEnabled && isGift ? giftFrom.trim() || undefined : undefined,
      giftOccasion: giftRecorderEnabled && isGift ? giftOccasion.trim() || undefined : undefined,
      createdAt: Date.now(),
    });
    onClose();
  };

  const inputClass = "w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/60 focus:ring-1 focus:ring-wardrobe-accent-gold/30 transition-all";
  const labelClass = "block text-xs font-medium text-ink-300 mb-1.5 uppercase tracking-wider";
  const subtypeOptions =
    productType === 'shirt' || productType === 't-shirt' || productType === 'kurta' || productType === 'kurti'
      ? catalog?.shirtSubtypes ?? []
      : productType === 'jeans' || productType === 'formal-pant' || productType === 'half-pant'
        ? catalog?.pantSubtypes ?? []
        : productType === 'shoes' || productType === 'sandals' || productType === 'heels' || productType === 'sneakers'
          ? catalog?.shoeSubtypes ?? []
          : [];

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={400}>
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[min(90vh,820px)] overflow-y-auto custom-scrollbar animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <h3 className="text-lg font-serif text-ink-50">{t(locale, 'addTitle')} · {collection.name}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <label className={`${labelClass} mb-0`}>{t(locale, 'language')}</label>
            <select
              value={locale}
              onChange={(e) => {
                const next = e.target.value as UiLocale;
                setLocale(next);
                setStoredUiLocale(next);
              }}
              className={`${inputClass} w-auto py-1 text-xs`}
            >
              {UI_LOCALES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <PhotoUpload
            imageUrl={photo.state.previewUrl}
            onChange={(url) => {
              if (!url) photo.clear();
            }}
            onFileSelected={photo.processFile}
            onAdjust={photo.state.cutoutStatus === 'succeeded' ? photo.openReview : undefined}
            needsCrop={photo.state.needsCrop}
            label={t(locale, 'photo')}
            cutoutPending={photo.state.cutoutStatus === 'queued' || photo.state.cutoutStatus === 'running'}
          />
          {giftRecorderEnabled && (
            <div className="rounded-lg border border-ink-700/60 p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm text-ink-200">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={(event) => setIsGift(event.target.checked)}
                  className="accent-wardrobe-accent-gold"
                />
                This item was a gift
              </label>
              {isGift && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Gift from</label>
                    <input value={giftFrom} onChange={(event) => setGiftFrom(event.target.value)} className={inputClass} placeholder="Person's name" />
                  </div>
                  <div>
                    <label className={labelClass}>Occasion</label>
                    <input value={giftOccasion} onChange={(event) => setGiftOccasion(event.target.value)} className={inputClass} placeholder="Birthday, holiday..." />
                  </div>
                </div>
              )}
            </div>
          )}
          {photo.state.reviewOpen && photo.state.previewUrl && (
            <GarmentCropModal
              imageUrl={photo.state.previewUrl}
              onClose={photo.closeReview}
              onSave={photo.confirmCrop}
            />
          )}
          {(photo.state.tagsStatus === 'queued' || photo.state.tagsStatus === 'running') && (
            <p className="text-[11px] text-amber-200/80">{t(locale, 'tagsBusy')}</p>
          )}
          {photo.state.cutoutStatus === 'running' && (
            <p className="text-[11px] text-amber-200/80">{t(locale, 'cutoutBusy')}</p>
          )}

          <div className="space-y-1.5">
            <button
              type="button"
              disabled={!speech.supported}
              onClick={() => {
                if (speech.listening) {
                  speech.stop();
                  return;
                }
                speech.start((text) => {
                  const parsed = parseUtterance(text);
                  const heard = text.trim().toLowerCase();
                  const english = parsed.normalized?.trim() ?? '';
                  setUnderstood(english && english.toLowerCase() !== heard ? english : '');
                  if (parsed.productType) {
                    setProductType(parsed.productType);
                    setCategoryId(categoryForProductType(collection, parsed.productType));
                  }
                  if (parsed.subtype) setSubtype(parsed.subtype);
                  if (parsed.color) {
                    setColor(titleCaseColor(parsed.color));
                    const namedHex = hexForColorName(parsed.color);
                    if (namedHex) setColorHex(namedHex);
                  }
                  if (parsed.occasion) setOccasion(parsed.occasion);
                  if (parsed.weather) {
                    setWeather(parsed.weather);
                    setSeason(weatherToSeason(parsed.weather));
                  }
                  if (parsed.brand) setBrand(parsed.brand);
                  if (parsed.size) setSize(parsed.size);
                  if (parsed.shelfIndex != null) setShelfIndex(parsed.shelfIndex);
                  if (parsed.suggestedName && (!name || autoFilledName.current)) {
                    setName(parsed.suggestedName);
                    autoFilledName.current = true;
                  }
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-ink-700 text-ink-200 hover:border-wardrobe-accent-gold/50 disabled:opacity-40"
            >
              <Mic className={`w-3.5 h-3.5 ${speech.listening ? 'text-wardrobe-accent-gold' : ''}`} />
              {speech.listening ? t(locale, 'listening') : t(locale, 'mic')}
            </button>
            {speech.transcript && (
              <p className="text-[11px] text-amber-100/80">
                {t(locale, 'heard')}: {speech.transcript}
              </p>
            )}
            {understood && (
              <p className="text-[11px] text-ink-400">
                {t(locale, 'understood')}: {understood}
              </p>
            )}
            {speech.error && <p className="text-[11px] text-red-400">{speech.error}</p>}
            {!speech.supported && (
              <p className="text-[11px] text-ink-500">{t(locale, 'speechUnsupported')}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t(locale, 'name')}</label>
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

          <ChipRow label={t(locale, 'type')} options={catalog?.types ?? []} value={productType} onChange={(value) => {
            setProductType(value);
            if (value) setCategoryId(categoryForProductType(collection, value));
          }} />
          <ChipRow label={t(locale, 'subtype')} options={subtypeOptions} value={subtype} onChange={setSubtype} />
          <ChipRow label={t(locale, 'occasion')} options={catalog?.occasions ?? []} value={occasion} onChange={setOccasion} />
          <ChipRow label={t(locale, 'weather')} options={catalog?.weather ?? []} value={weather} onChange={(value) => {
            setWeather(value);
            setSeason(weatherToSeason(value));
          }} />

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
              <label className={labelClass}>{t(locale, 'shelf')}</label>
              <select value={shelfIndex} onChange={(e) => setShelfIndex(Number(e.target.value))} className={inputClass}>
                {Array.from({ length: shelfCount }, (_, i) => (
                  <option key={i} value={i}>Shelf {i + 1}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t(locale, 'brand')}</label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} placeholder="e.g. Zara" />
            </div>
            <div>
              <label className={labelClass}>{t(locale, 'size')}</label>
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
            <label className={labelClass}>{t(locale, 'color')}</label>
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
            <label className={labelClass}>{t(locale, 'notes')} (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Any details..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:bg-ink-700/50 transition-all">
              {t(locale, 'cancel')}
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all">
              {t(locale, 'save')}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
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
          ? 'bg-wardrobe-accent-gold/20 text-amber-800 border border-wardrobe-accent-gold/50'
          : 'bg-white/70 text-ink-500 border border-amber-200/80 hover:border-wardrobe-accent-gold/50 hover:text-ink-700'
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
  loftBoxes, onMoveToLoft, onReturnFromLoft, onOpenLoft, onOpenCreateLook,
  giftRecorderEnabled,
}: WardrobeInteriorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [activeSeasonFilter, setActiveSeasonFilter] = useState<SeasonFilterValue>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Detail / edit / look modals
  const [detailItem, setDetailItem] = useState<WardrobeItem | null>(null);
  const [editItem, setEditItem] = useState<WardrobeItem | null>(null);
  const [viewingLook, setViewingLook] = useState<Look | null>(null);

  const isShelfMode = (collection.displayMode ?? 'category') === 'shelf';
  const shelfCount = collection.shelfCount ?? DEFAULT_SHELF_COUNT;
  const showSeasonFilters = collection.enableSeasonFilter ?? true;

  const filteredItems = items.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (isShelfMode) {
      if (activeCategoryId !== 'all' && String(item.shelfIndex ?? 0) !== activeCategoryId) return false;
    } else if (activeCategoryId !== 'all' && item.categoryId !== activeCategoryId) {
      return false;
    }
    if (showSeasonFilters && !itemMatchesSeasonFilter(item, activeSeasonFilter)) return false;
    if (showFavoritesOnly && !item.favorite) return false;
    return true;
  });

  const itemsByCategory = (categoryId: string) =>
    filteredItems.filter((item) => item.categoryId === categoryId);

  const itemsByShelf = (shelfIdx: number) =>
    filteredItems.filter((item) => (item.shelfIndex ?? 0) === shelfIdx);

  const shelfRows = Array.from({ length: shelfCount }, (_, i) => ({
    id: String(i),
    label: `Shelf ${i + 1}`,
  }));

  const shelvesToShow = isShelfMode
    ? (activeCategoryId === 'all' ? shelfRows : shelfRows.filter((s) => s.id === activeCategoryId))
    : (activeCategoryId === 'all'
      ? collection.categories
      : collection.categories.filter((c) => c.id === activeCategoryId));

  const shownCount = filteredItems.length;
  const totalCount = items.length;

  // Keep detail item in sync with latest data (for favorite toggles etc.)
  const currentDetailItem = detailItem
    ? allItems.find((i) => i.id === detailItem.id) ?? null
    : null;

  const {
    dragState,
    draggingItemId,
    setZoneRef,
    onItemPointerDown,
    onItemPointerMove,
    onItemPointerUp,
    onItemPointerCancel,
  } = useItemDrag({
    onOpenDetail: setDetailItem,
    onSendToLaundry: (item) => {
      if (!item.inLaundry) onToggleLaundry(item.id);
    },
    onMarkDonation: (item) => {
      onEditItem({
        ...item,
        markedForDonation: true,
        donationMarkedAt: Date.now(),
        inLaundry: false,
      });
    },
    onDelete: (item) => onDeleteItem(item.id),
  });

  return (
    <div className="h-full flex flex-col shelf-wall">
      {/* Top utility shelf */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2.5 bg-gradient-to-b from-white/70 to-transparent border-b border-amber-200/60">
        <div className="flex gap-1.5 items-center mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${collection.name.toLowerCase()}...`}
              className="w-full bg-white/80 border border-amber-200/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink-800 placeholder-ink-400 focus:outline-none focus:border-wardrobe-accent-gold/70 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-2.5 py-1.5 rounded-lg border transition-all ${
              showFavoritesOnly
                ? 'border-wardrobe-accent-rose/50 bg-wardrobe-accent-rose/15 text-wardrobe-accent-rose'
                : 'border-amber-200/80 text-ink-400 hover:text-ink-700 hover:border-amber-300 bg-white/70'
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
            {isShelfMode
              ? shelfRows.map((shelf) => (
                  <FilterChip
                    key={shelf.id}
                    label={shelf.label}
                    active={activeCategoryId === shelf.id}
                    onClick={() => setActiveCategoryId(shelf.id)}
                  />
                ))
              : collection.categories.map((cat) => (
                  <FilterChip
                    key={cat.id}
                    label={cat.label}
                    active={activeCategoryId === cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                  />
                ))}
          </div>
          {showSeasonFilters && (
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
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-ink-400 mt-1.5">
          <span>{shownCount} of {totalCount} pieces</span>
          <span className="text-ink-400 hidden sm:inline">Drag to sort · tap to view</span>
        </div>
      </div>

      <div className="shelf-board relative h-2 mx-1 flex-shrink-0" />

      {/* Scrollable shelves */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {shownCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <div className="w-14 h-14 rounded-full bg-white/80 border border-amber-200/80 flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-ink-400" />
            </div>
            <p className="text-ink-600 text-sm">No pieces found</p>
            <p className="text-ink-400 text-xs mt-1">Try adjusting your filters or add a new piece</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {shelvesToShow.map((row) => {
              const rowItems = isShelfMode
                ? itemsByShelf(Number(row.id))
                : itemsByCategory(row.id);
              if (rowItems.length === 0) return null;
              return (
                <Shelf
                  key={row.id}
                  label={row.label}
                  items={rowItems}
                  draggingItemId={draggingItemId}
                  onToggleFavorite={onToggleFavorite}
                  onItemPointerDown={onItemPointerDown}
                  onItemPointerMove={onItemPointerMove}
                  onItemPointerUp={onItemPointerUp}
                  onItemPointerCancel={onItemPointerCancel}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="shelf-board relative h-2 mx-1 flex-shrink-0" />

      {dragState && (
        <ItemDragOverlay dragState={dragState} setZoneRef={setZoneRef} />
      )}

      {showAddModal && (
        <AddItemModal
          collection={collection}
          onClose={() => setShowAddModal(false)}
          onAdd={onAddItem}
          giftRecorderEnabled={giftRecorderEnabled}
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
          onCreateLook={() => {
            onOpenCreateLook({ primaryItem: currentDetailItem });
            setDetailItem(null);
          }}
          onViewLook={(look) => { setViewingLook(look); setDetailItem(null); }}
          onToggleFavorite={onToggleFavorite}
          onToggleLaundry={onToggleLaundry}
          onMarkWorn={() => onEditItem(markItemWornToday(currentDetailItem))}
          loftBoxes={loftBoxes}
          loftBoxName={loftBoxes.find((b) => b.id === currentDetailItem.loftBoxId)?.name}
          onMoveToLoft={(boxId) => {
            onMoveToLoft([currentDetailItem.id], boxId);
            setDetailItem(null);
          }}
          onReturnFromLoft={() => {
            onReturnFromLoft([currentDetailItem.id]);
            setDetailItem(null);
          }}
          onOpenLoft={onOpenLoft}
        />
      )}

      {/* Edit item modal */}
      {editItem && (
        <EditItemModal
          item={editItem}
          collection={allCollections.find((c) => c.id === editItem.collectionId) ?? collection}
          onClose={() => setEditItem(null)}
          onSave={(updated) => { onEditItem(updated); setEditItem(null); }}
          giftRecorderEnabled={giftRecorderEnabled}
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
            onOpenCreateLook({ primaryItem: primary, existingLook: viewingLook });
            setViewingLook(null);
          }}
          onItemClick={(item) => { setViewingLook(null); setDetailItem(item); }}
        />
      )}
    </div>
  );
}
