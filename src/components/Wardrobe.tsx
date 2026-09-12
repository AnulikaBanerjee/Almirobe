import { useState, useEffect, useRef, useCallback } from 'react';
import { DoorOpen } from 'lucide-react';
import type { LoftBox, WardrobeItem, WardrobeCollection, Look } from '@/types';
import WardrobeInterior from './WardrobeInterior';

interface WardrobeProps {
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
}

type DoorState = 'closed' | 'opening' | 'open' | 'closing';

const DOOR_OPEN_MS = 1200;
const DOOR_CLOSE_MS = 1000;

export default function Wardrobe({
  collection, items, allItems, allCollections, looks,
  onAddItem, onEditItem, onToggleFavorite, onDeleteItem,
  onSaveLook, onDeleteLook, onToggleLaundry,
  loftBoxes, onMoveToLoft, onReturnFromLoft, onOpenLoft,
}: WardrobeProps) {
  const [doorState, setDoorState] = useState<DoorState>('closed');
  const doorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDoorTimer = useCallback(() => {
    if (doorTimerRef.current) {
      clearTimeout(doorTimerRef.current);
      doorTimerRef.current = null;
    }
  }, []);

  const scheduleDoorState = useCallback((next: DoorState, delayMs: number) => {
    clearDoorTimer();
    doorTimerRef.current = setTimeout(() => {
      setDoorState(next);
      doorTimerRef.current = null;
    }, delayMs);
  }, [clearDoorTimer]);

  // Reset doors when switching collections
  useEffect(() => {
    clearDoorTimer();
    setDoorState('closed');
  }, [collection.id, clearDoorTimer]);

  useEffect(() => () => clearDoorTimer(), [clearDoorTimer]);

  const handleOpen = () => {
    if (doorState === 'closed') {
      setDoorState('opening');
      scheduleDoorState('open', DOOR_OPEN_MS);
    }
  };

  const handleClose = () => {
    if (doorState === 'open') {
      setDoorState('closing');
      scheduleDoorState('closed', DOOR_CLOSE_MS);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative select-none"
        style={{ width: 'min(940px, 94vw)', height: 'min(640px, 82vh)' }}
      >
        <div className="absolute -inset-2 rounded-t-2xl bg-gradient-to-b from-wardrobe-wood-darker via-wardrobe-wood-dark to-wardrobe-wood-darker shadow-2xl shadow-black/50" />
        <div className="absolute -top-2 left-0 right-0 h-3 rounded-t-2xl bg-gradient-to-r from-wardrobe-wood-dark via-wardrobe-wood-mid to-wardrobe-wood-dark" />

        <div className="absolute inset-0 rounded-lg overflow-hidden bg-wardrobe-wood-darker shadow-inner">
          <div className="absolute inset-0 closet-interior z-10">
            {doorState === 'open' && (
              <div className="h-full w-full animate-fade-in">
                <WardrobeInterior
                  collection={collection}
                  items={items}
                  allItems={allItems}
                  allCollections={allCollections}
                  looks={looks}
                  onAddItem={onAddItem}
                  onEditItem={onEditItem}
                  onToggleFavorite={onToggleFavorite}
                  onDeleteItem={onDeleteItem}
                  onSaveLook={onSaveLook}
                  onDeleteLook={onDeleteLook}
                  onToggleLaundry={onToggleLaundry}
                  loftBoxes={loftBoxes}
                  onMoveToLoft={onMoveToLoft}
                  onReturnFromLoft={onReturnFromLoft}
                  onOpenLoft={onOpenLoft}
                />
              </div>
            )}
          </div>

          <Door side="left" doorState={doorState} onClick={handleOpen} />
          <Door side="right" doorState={doorState} onClick={handleOpen} />
        </div>

        <div className="absolute -bottom-2 -left-2 -right-2 h-4 rounded-b-xl bg-gradient-to-b from-wardrobe-wood-dark to-wardrobe-wood-darker shadow-xl" />
      </div>

      <div className="mt-6">
        {doorState === 'closed' && (
          <button
            onClick={handleOpen}
            className="group flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 text-ink-900 font-medium shadow-lg shadow-wardrobe-accent-gold/20 hover:shadow-xl hover:shadow-wardrobe-accent-gold/40 hover:scale-105 transition-all animate-fade-in-up"
          >
            <DoorOpen className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Open the Wardrobe
          </button>
        )}
        {doorState === 'open' && (
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-ink-800 border border-ink-700 text-ink-200 font-medium hover:bg-ink-700 hover:border-ink-600 transition-all animate-fade-in"
          >
            Close the Wardrobe
          </button>
        )}
      </div>
    </div>
  );
}

function Door({ side, doorState, onClick }: {
  side: 'left' | 'right';
  doorState: DoorState;
  onClick: () => void;
}) {
  const isLeft = side === 'left';

  const animationClass =
    doorState === 'opening'
      ? isLeft ? 'animate-door-open-left' : 'animate-door-open-right'
      : doorState === 'closing'
      ? isLeft ? 'animate-door-close-left' : 'animate-door-close-right'
      : '';

  const transformStyle =
    doorState === 'open'
      ? isLeft
        ? { transform: 'perspective(1200px) rotateY(-105deg)' }
        : { transform: 'perspective(1200px) rotateY(105deg)' }
      : doorState === 'closed'
      ? { transform: 'perspective(1200px) rotateY(0deg)' }
      : {};

  return (
    <div
      className={`absolute top-0 bottom-0 z-20 ${isLeft ? 'left-0 origin-left' : 'right-0 origin-right'} ${animationClass}`}
      style={{
        ...transformStyle,
        width: '50%',
        transition: doorState === 'open' || doorState === 'closed' ? 'none' : undefined,
      }}
      onClick={onClick}
    >
      <div className="w-full h-full bg-gradient-to-br from-wardrobe-wood-light via-wardrobe-wood-mid to-wardrobe-wood-dark wood-grain shadow-2xl cursor-pointer relative overflow-hidden">
        <div className={`absolute inset-3 border-2 border-wardrobe-wood-dark/40 rounded ${isLeft ? 'border-r-4' : 'border-l-4'}`}>
          <div className="absolute inset-1.5 border border-wardrobe-wood-darker/30 rounded-sm" />
        </div>

        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, rgba(0,0,0,0.15) 1px, transparent 4px, rgba(255,255,255,0.05) 7px, transparent 12px)',
          }} />

        <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'right-3' : 'left-3'} z-30`}>
          <div className={`w-2 h-16 rounded-full bg-gradient-to-b from-wardrobe-accent-gold via-amber-600 to-wardrobe-accent-gold shadow-lg ${
            doorState === 'closed' ? 'animate-handle-glow' : ''
          }`} />
        </div>

        <div className={`absolute inset-0 bg-gradient-to-r ${isLeft ? 'from-transparent via-white/5 to-white/10' : 'from-white/10 via-white/5 to-transparent'} pointer-events-none`} />
      </div>
    </div>
  );
}