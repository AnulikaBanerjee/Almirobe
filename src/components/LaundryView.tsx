import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, WashingMachine, RotateCcw, Droplets } from 'lucide-react';
import type { WardrobeItem, WardrobeCollection } from '@/types';
import { SEASON_LABELS } from '@/types';
import { stableRange } from '@/utils/stableHash';
import ItemImage from '@/components/ItemImage';
import { getItemImageRef } from '@/images/itemImage';

interface LaundryViewProps {
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  onToggleLaundry: (id: string) => void;
  onBack: () => void;
}

function findCategoryLabel(collection: WardrobeCollection | undefined, categoryId: string): string {
  return collection?.categories.find((c) => c.id === categoryId)?.label ?? 'Uncategorized';
}

function WickerHamper() {
  return (
    <svg viewBox="0 0 240 200" className="w-56 h-auto drop-shadow-2xl" fill="none">
      <defs>
        <linearGradient id="wickerBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a07852" />
          <stop offset="50%" stopColor="#8b6539" />
          <stop offset="100%" stopColor="#6d4f2a" />
        </linearGradient>
        <linearGradient id="wickerRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8916a" />
          <stop offset="100%" stopColor="#9a7350" />
        </linearGradient>
        <linearGradient id="wickerDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a5a38" />
          <stop offset="100%" stopColor="#5c4220" />
        </linearGradient>
        <radialGradient id="innerShadow" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#3a2a15" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3a2a15" stopOpacity="0" />
        </radialGradient>
        <pattern id="weavePattern" x="0" y="0" width="16" height="10" patternUnits="userSpaceOnUse">
          <rect width="16" height="10" fill="url(#wickerBase)" />
          <path d="M0 5 Q4 0 8 5 Q12 10 16 5" stroke="#6d4f2a" strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M0 5 Q4 10 8 5 Q12 0 16 5" stroke="#b8916a" strokeWidth="1" fill="none" opacity="0.3" />
        </pattern>
      </defs>

      {/* Hamper body — tapered shape */}
      <path d="M40 50 L200 50 L190 190 L50 190 Z" fill="url(#weavePattern)" />
      {/* Side shading */}
      <path d="M40 50 L200 50 L190 190 L50 190 Z" fill="url(#innerShadow)" opacity="0.4" />
      {/* Left edge highlight */}
      <path d="M40 50 L50 190" stroke="#b8916a" strokeWidth="1.5" opacity="0.4" />
      {/* Right edge shadow */}
      <path d="M200 50 L190 190" stroke="#4a3418" strokeWidth="1.5" opacity="0.5" />

      {/* Horizontal weave bands */}
      {[75, 100, 125, 150, 175].map((y) => (
        <line key={y} x1="42" y1={y} x2="198" y2={y} stroke="#5c4220" strokeWidth="1.5" opacity="0.3" />
      ))}

      {/* Vertical weave lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const xTop = 44 + i * 13;
        const xBot = 52 + i * 11.7;
        return <line key={i} x1={xTop} y1="52" x2={xBot} y2="188" stroke="#5c4220" strokeWidth="0.8" opacity="0.2" />;
      })}

      {/* Rim — thick oval at top */}
      <ellipse cx="120" cy="50" rx="82" ry="14" fill="url(#wickerRim)" />
      <ellipse cx="120" cy="48" rx="80" ry="11" fill="url(#wickerDark)" opacity="0.5" />
      <ellipse cx="120" cy="50" rx="74" ry="9" fill="#2a1f10" opacity="0.6" />
      <ellipse cx="120" cy="50" rx="82" ry="14" fill="none" stroke="#4a3418" strokeWidth="1" opacity="0.5" />

      {/* Rim weave detail */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const x = 120 + Math.cos(angle) * 80;
        const y = 50 + Math.sin(angle) * 13;
        return <circle key={i} cx={x} cy={y} r="1.5" fill="#6d4f2a" opacity="0.5" />;
      })}

      {/* Handles */}
      <path d="M58 52 Q54 38 48 42 Q44 46 48 55" fill="none" stroke="#8b6539" strokeWidth="3" strokeLinecap="round" />
      <path d="M182 52 Q186 38 192 42 Q196 46 192 55" fill="none" stroke="#8b6539" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function TippedHamper() {
  return (
    <svg viewBox="0 0 240 200" className="w-44 h-auto opacity-25" fill="none">
      <defs>
        <linearGradient id="wickerBaseTipped" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a07852" />
          <stop offset="100%" stopColor="#6d4f2a" />
        </linearGradient>
      </defs>
      <path d="M40 50 L200 50 L190 190 L50 190 Z" fill="url(#wickerBaseTipped)" />
      <ellipse cx="120" cy="50" rx="82" ry="14" fill="#9a7350" />
      <ellipse cx="120" cy="50" rx="74" ry="9" fill="#2a1f10" opacity="0.6" />
    </svg>
  );
}

/** A piece of fabric draped over the hamper rim */
function DrapedCloth({ item, index, total }: { item: WardrobeItem; index: number; total: number }) {
  const positions = [
    { x: 60, w: 50, rot: -15, dy: 0 },
    { x: 110, w: 55, rot: 5, dy: -2 },
    { x: 165, w: 45, rot: 18, dy: 1 },
    { x: 85, w: 40, rot: -8, dy: 3 },
    { x: 145, w: 48, rot: 12, dy: 2 },
  ];
  const pos = positions[index % positions.length];
  const zIndex = total - index;

  return (
    <div
      className="absolute"
      style={{
        left: `${pos.x}px`,
        top: `${30 + pos.dy}px`,
        width: `${pos.w}px`,
        zIndex,
        transform: `rotate(${pos.rot}deg)`,
      }}
    >
      <div
        className="rounded-t-lg rounded-b shadow-lg border border-black/20 overflow-hidden relative"
        style={{
          height: `${28 + (index % 2) * 6}px`,
          backgroundColor: item.colorHex,
          backgroundImage: getItemImageRef(item)?.startsWith('data:') || getItemImageRef(item)?.startsWith('/uploads/')
            ? `url(${getItemImageRef(item)})`
            : `linear-gradient(180deg, ${item.colorHex}, ${item.colorHex}cc)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full h-full rounded-t-lg rounded-b bg-gradient-to-b from-white/15 via-transparent to-black/20" />
      </div>
    </div>
  );
}

export default function LaundryView({
  allItems, allCollections, onToggleLaundry, onBack,
}: LaundryViewProps) {
  const [scattered, setScattered] = useState(false);
  const [showList, setShowList] = useState(false);

  const laundryItems = useMemo(
    () => allItems.filter((item) => item.inLaundry),
    [allItems]
  );

  const findCol = (id: string) => allCollections.find((c) => c.id === id);

  const scatterData = useMemo(() => {
    return laundryItems.map((item, i) => {
      const angle = (i * 137.5) % 360;
      const distance = 90 + (i % 3) * 55;
      const tx = Math.cos((angle * Math.PI) / 180) * distance;
      const ty = Math.sin((angle * Math.PI) / 180) * distance * 0.45 + 70;
      const rot = stableRange(item.id, -60, 60, i);
      return { item, tx, ty, rot, delay: i * 0.06 };
    });
  }, [laundryItems]);

  const scatterListTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScatterListTimer = useCallback(() => {
    if (scatterListTimerRef.current) {
      clearTimeout(scatterListTimerRef.current);
      scatterListTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearScatterListTimer(), [clearScatterListTimer]);

  const handleBasketClick = () => {
    if (laundryItems.length === 0) return;
    setScattered(true);
    clearScatterListTimer();
    scatterListTimerRef.current = setTimeout(() => {
      setShowList(true);
      scatterListTimerRef.current = null;
    }, 1300);
  };

  const handleReset = () => {
    clearScatterListTimer();
    setShowList(false);
    setScattered(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full border border-ink-700 bg-ink-800/60 text-ink-400 hover:text-ink-100 hover:border-ink-600 hover:bg-ink-700/60 transition-all flex items-center justify-center"
            aria-label="Back to wardrobes"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-serif text-ink-50 flex items-center gap-2">
              <WashingMachine className="w-6 h-6 text-sky-400" />
              Laundry Room
            </h2>
            <p className="text-xs text-ink-400 mt-0.5">
              {laundryItems.length} {laundryItems.length === 1 ? 'item' : 'items'} in the hamper
            </p>
          </div>
        </div>

        {(scattered || showList) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:bg-ink-700/50 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {/* Scene area */}
      <div className="relative rounded-2xl border border-ink-700/40 bg-gradient-to-b from-ink-800/60 via-ink-850/70 to-ink-900/80 overflow-hidden" style={{ minHeight: '440px' }}>
        {/* Tile floor pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.1) 44px, rgba(255,255,255,0.1) 45px),
                              repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.1) 44px, rgba(255,255,255,0.1) 45px)`,
          }}
        />

        {/* Soft ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[280px] bg-sky-500/5 rounded-full blur-[90px] pointer-events-none" />

        {/* Empty state */}
        {laundryItems.length === 0 && !scattered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-ink-800/50 border border-ink-700/50 flex items-center justify-center mb-4">
              <Droplets className="w-9 h-9 text-sky-400/40" />
            </div>
            <h3 className="text-lg font-serif text-ink-300 mb-1">The hamper is empty</h3>
            <p className="text-ink-500 text-sm max-w-xs">
              Open any item in your wardrobe and tap "Laundry" to add it here.
            </p>
          </div>
        )}

        {/* Laundry hamper — clickable, falls and scatters */}
        {laundryItems.length > 0 && !scattered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer select-none group" onClick={handleBasketClick}>
            {/* Hamper with clothes */}
            <div className="relative animate-basket-fall group-hover:scale-[1.03] transition-transform duration-300" style={{ paddingTop: '28px' }}>
              {/* Clothes draped over the rim */}
              <div className="absolute top-0 left-0 right-0 flex justify-center" style={{ height: '40px', zIndex: 10 }}>
                {laundryItems.slice(0, 5).map((item, i) => (
                  <DrapedCloth key={item.id} item={item} index={i} total={Math.min(laundryItems.length, 5)} />
                ))}
              </div>

              {/* The wicker hamper SVG */}
              <WickerHamper />

              {/* Count badge */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-ink-900/70 backdrop-blur-sm rounded-lg px-3.5 py-1.5 border border-ink-700/50 shadow-lg">
                  <p className="text-xs text-ink-200 font-medium text-center tracking-wide">{laundryItems.length} {laundryItems.length === 1 ? 'item' : 'items'}</p>
                </div>
              </div>
            </div>

            {/* Pulsing hint */}
            <div className="mt-8 animate-pulse">
              <p className="text-sm text-sky-300/60 font-medium tracking-wide">Click the hamper to see what's inside</p>
            </div>
          </div>
        )}

        {/* Scattered clothes animation */}
        {scattered && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Tipped hamper */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-basket-tip"
              style={{ transformOrigin: 'bottom left' }}
            >
              <TippedHamper />
            </div>

            {/* Scattered clothing items */}
            {scatterData.map(({ item, tx, ty, rot, delay }) => (
              <div
                key={item.id}
                className="absolute"
                style={{
                  animation: `clothesScatter 0.6s ease-out ${delay}s forwards`,
                  opacity: 0,
                  ['--tx' as string]: `${tx}px`,
                  ['--ty' as string]: `${ty}px`,
                  ['--rot' as string]: `${rot}deg`,
                }}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-ink-700/50 shadow-2xl">
                  <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show list overlay */}
        {showList && (
          <div className="absolute inset-0 bg-ink-900/95 backdrop-blur-sm animate-fade-in overflow-y-auto custom-scrollbar">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif text-ink-50 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-sky-400" />
                  In the Laundry Hamper
                </h3>
                <span className="text-xs text-ink-400">{laundryItems.length} items</span>
              </div>

              {laundryItems.length === 0 ? (
                <p className="text-ink-500 text-sm text-center py-8">No items in laundry</p>
              ) : (
                <div className="space-y-2">
                  {laundryItems.map((item) => {
                    const collection = findCol(item.collectionId);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/60 border border-ink-700/40 hover:border-ink-600 transition-all"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-ink-700 flex-shrink-0">
                          <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-100 truncate">{item.name}</p>
                          <p className="text-xs text-ink-500 truncate">
                            {item.brand} · {findCategoryLabel(collection, item.categoryId)} · {SEASON_LABELS[item.season]}
                          </p>
                        </div>
                        <button
                          onClick={() => onToggleLaundry(item.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-sky-300 bg-sky-900/30 border border-sky-700/40 hover:bg-sky-800/40 hover:border-sky-600/50 transition-all flex-shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Clean
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {laundryItems.length > 1 && (
                <button
                  onClick={() => {
                    laundryItems.forEach((item) => onToggleLaundry(item.id));
                    handleReset();
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:shadow-lg hover:shadow-sky-500/20 transition-all"
                >
                  <WashingMachine className="w-4 h-4" />
                  Wash All ({laundryItems.length} items)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
