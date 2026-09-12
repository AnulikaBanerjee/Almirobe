import { useMemo, useRef, useState } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import type { WardrobeCollection, WardrobeItem } from '@/types';
import { getUnwornItems, markItemWornToday, monthsSinceWorn } from '@/reports/wearTracking';
import ItemImage from '@/components/ItemImage';

const MONTH_OPTIONS = [3, 6, 12];

interface DeclutterSwipePanelProps {
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  onKeep: (item: WardrobeItem) => void;
  onThrowAway: (itemId: string) => void;
}

export default function DeclutterSwipePanel({
  items,
  collections,
  onKeep,
  onThrowAway,
}: DeclutterSwipePanelProps) {
  const [months, setMonths] = useState(6);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragOrigin = useRef(0);

  const queue = useMemo(() => {
    return getUnwornItems(items, months).filter((i) => !dismissed.has(i.id));
  }, [items, months, dismissed]);

  const current = queue[0];
  const collection = current
    ? collections.find((c) => c.id === current.collectionId)
    : undefined;

  const handleKeep = () => {
    if (!current) return;
    onKeep(markItemWornToday(current));
    setDismissed((prev) => new Set(prev).add(current.id));
    setDragX(0);
  };

  const handleThrow = () => {
    if (!current) return;
    onThrowAway(current.id);
    setDismissed((prev) => new Set(prev).add(current.id));
    setDragX(0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
    dragOrigin.current = dragX;
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragX(dragOrigin.current + (e.clientX - dragStartX.current));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
    const x = dragOrigin.current + (e.clientX - dragStartX.current);
    setDragX(0);
    if (x > 80) handleKeep();
    else if (x < -80) handleThrow();
  };

  const rotation = dragX * 0.05;
  const keepOpacity = Math.min(1, Math.max(0, dragX / 80));
  const throwOpacity = Math.min(1, Math.max(0, -dragX / 80));

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-400">
        Review items you haven&apos;t worn recently. Swipe <strong className="text-emerald-400">right to keep</strong> or{' '}
        <strong className="text-red-400">left to remove</strong>. Wear tracking improves as you log outfits.
      </p>

      <div>
        <label className="text-xs text-ink-500 uppercase tracking-wider">Not worn in</label>
        <div className="flex gap-2 mt-2">
          {MONTH_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMonths(m);
                setDismissed(new Set());
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                months === m
                  ? 'border-wardrobe-accent-gold/50 bg-wardrobe-accent-gold/15 text-wardrobe-accent-gold'
                  : 'border-ink-700 text-ink-400 hover:border-ink-600'
              }`}
            >
              {m} months
            </button>
          ))}
        </div>
      </div>

      {current ? (
        <>
          <div className="relative h-72 flex items-center justify-center">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400 font-bold text-sm border-2 border-red-400 rounded-lg px-2 py-1 rotate-[-12deg] transition-opacity"
              style={{ opacity: throwOpacity }}
            >
              REMOVE
            </span>
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm border-2 border-emerald-400 rounded-lg px-2 py-1 rotate-[12deg] transition-opacity"
              style={{ opacity: keepOpacity }}
            >
              KEEP
            </span>

            <div
              className="w-56 rounded-2xl border border-ink-700 bg-ink-900/60 overflow-hidden shadow-xl touch-none select-none cursor-grab active:cursor-grabbing"
              style={{
                transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.25s ease-out',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div className="aspect-square relative">
                <ItemImage item={current} alt={current.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-ink-100 truncate">{current.name}</p>
                <p className="text-xs text-ink-500">{current.brand} · {collection?.name}</p>
                <p className="text-[10px] text-ink-600 mt-1">
                  Last worn {monthsSinceWorn(current).toFixed(1)} mo ago
                  {!current.lastWornAt && ' (estimated from added date)'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-ink-500">{queue.length} item{queue.length !== 1 ? 's' : ''} left to review</p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleThrow}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-400/40 text-red-400 hover:bg-red-400/10 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
            <button
              type="button"
              onClick={handleKeep}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10 text-sm"
            >
              <Heart className="w-4 h-4" />
              Keep
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 rounded-xl border border-dashed border-ink-700">
          <p className="text-sm text-ink-300">All caught up!</p>
          <p className="text-xs text-ink-500 mt-1">No items unworn for {months}+ months in this review.</p>
        </div>
      )}
    </div>
  );
}
