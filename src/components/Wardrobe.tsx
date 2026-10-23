import { useState, useEffect, useRef, useCallback } from 'react';
import { DoorOpen } from 'lucide-react';
import type { LookEditorContext } from '@/looks';
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
  onOpenCreateLook: (ctx: LookEditorContext) => void;
}

type DoorState = 'closed' | 'opening' | 'open' | 'closing';

const DOOR_OPEN_MS = 1200;
const DOOR_CLOSE_MS = 1000;

export default function Wardrobe({
  collection, items, allItems, allCollections, looks,
  onAddItem, onEditItem, onToggleFavorite, onDeleteItem,
  onSaveLook, onDeleteLook, onToggleLaundry,
  loftBoxes, onMoveToLoft, onReturnFromLoft, onOpenLoft, onOpenCreateLook,
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
        style={{ width: 'min(940px, 94vw)', height: 'min(640px, 82vh)', perspective: '1600px' }}
      >
        <div
          className="absolute -inset-[7px] rounded-[18px] shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, #e8d39a 0%, #c9a96e 42%, #a88745 100%)',
            boxShadow: '0 28px 50px rgba(120, 90, 40, 0.22), 0 2px 0 rgba(255,255,255,0.45) inset',
          }}
        />
        <div className="absolute -top-3 left-6 right-6 h-2 rounded-full bg-gradient-to-r from-transparent via-amber-200/80 to-transparent blur-[1px]" />

        <div className="absolute inset-0 rounded-[12px] overflow-hidden bg-wardrobe-interior shadow-inner">
          <div className="absolute inset-0 closet-interior z-10">
            <div className="absolute top-0 left-0 right-0 h-10 pointer-events-none bg-gradient-to-b from-amber-100/70 to-transparent" />
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
                  onOpenCreateLook={onOpenCreateLook}
                />
              </div>
            )}
          </div>

          <Door side="left" doorState={doorState} onClick={handleOpen} />
          <Door side="right" doorState={doorState} onClick={handleOpen} />
        </div>

        <div
          className="absolute -bottom-3 -left-1 -right-1 h-3 rounded-b-xl"
          style={{
            background: 'linear-gradient(180deg, #d4b56a 0%, #b08d4f 100%)',
            boxShadow: '0 10px 18px rgba(120, 90, 40, 0.2)',
          }}
        />
      </div>

      <div className="mt-8">
        {doorState === 'closed' && (
          <button
            onClick={handleOpen}
            className="group flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 text-ink-900 font-medium shadow-lg shadow-wardrobe-accent-gold/25 hover:shadow-xl hover:shadow-wardrobe-accent-gold/40 hover:scale-105 transition-all animate-fade-in-up"
          >
            <DoorOpen className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Open the Wardrobe
          </button>
        )}
        {doorState === 'open' && (
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-wardrobe-accent-gold/40 text-ink-700 font-medium hover:bg-amber-50 hover:border-wardrobe-accent-gold/70 transition-all animate-fade-in shadow-sm"
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
        transformStyle: 'preserve-3d',
      }}
      onClick={onClick}
    >
      <div
        className="w-full h-full cursor-pointer relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f7f4ee 48%, #efe9dc 100%)',
          boxShadow: isLeft
            ? 'inset -10px 0 18px rgba(160, 130, 70, 0.12), 8px 0 24px rgba(80, 60, 20, 0.12)'
            : 'inset 10px 0 18px rgba(160, 130, 70, 0.12), -8px 0 24px rgba(80, 60, 20, 0.12)',
          borderLeft: isLeft ? '3px solid #c9a96e' : '1px solid rgba(201,169,110,0.55)',
          borderRight: isLeft ? '1px solid rgba(201,169,110,0.55)' : '3px solid #c9a96e',
          borderTop: '3px solid #d4b56a',
          borderBottom: '3px solid #b08d4f',
        }}
      >
        <div className="absolute inset-[14px] rounded-sm" style={{ boxShadow: 'inset 0 0 0 1px rgba(201,169,110,0.35)' }} />
        <div
          className="absolute left-[14px] right-[14px] h-[18%] top-[38%]"
          style={{
            background: 'linear-gradient(180deg, #e8d39a 0%, #c9a96e 50%, #b08d4f 100%)',
            boxShadow: '0 4px 10px rgba(140, 110, 50, 0.18)',
          }}
        />
        <div className={`absolute inset-0 pointer-events-none bg-gradient-to-r ${isLeft ? 'from-white/50 via-transparent to-black/[0.04]' : 'from-black/[0.04] via-transparent to-white/50'}`} />

        <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'right-3' : 'left-3'} z-30`}>
          <div
            className={`w-1.5 h-[72px] rounded-full ${doorState === 'closed' ? 'animate-handle-glow' : ''}`}
            style={{
              background: 'linear-gradient(180deg, #f3e2b0 0%, #c9a96e 45%, #a88745 100%)',
              boxShadow: '0 2px 8px rgba(160, 120, 40, 0.35)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
