import { createPortal } from 'react-dom';
import { Package, Trash2, WashingMachine } from 'lucide-react';
import type { DropZoneId, ItemDragState } from '@/components/itemDrag/types';
import ItemImage from '@/components/ItemImage';

const ZONES: { id: DropZoneId; label: string; icon: typeof WashingMachine; activeClass: string; idleClass: string }[] = [
  {
    id: 'laundry',
    label: 'Laundry',
    icon: WashingMachine,
    idleClass: 'border-sky-700/50 bg-sky-950/60 text-sky-300',
    activeClass: 'border-sky-400 bg-sky-500/30 text-sky-100 scale-110 shadow-lg shadow-sky-500/30',
  },
  {
    id: 'donation',
    label: 'Donate',
    icon: Package,
    idleClass: 'border-emerald-700/50 bg-emerald-950/60 text-emerald-300',
    activeClass: 'border-emerald-400 bg-emerald-500/30 text-emerald-100 scale-110 shadow-lg shadow-emerald-500/30',
  },
  {
    id: 'delete',
    label: 'Discard',
    icon: Trash2,
    idleClass: 'border-red-800/50 bg-red-950/60 text-red-300',
    activeClass: 'border-red-400 bg-red-500/30 text-red-100 scale-110 shadow-lg shadow-red-500/30',
  },
];

interface ItemDragOverlayProps {
  dragState: ItemDragState;
  setZoneRef: (id: DropZoneId, el: HTMLDivElement | null) => void;
}

export default function ItemDragOverlay({ dragState, setZoneRef }: ItemDragOverlayProps) {
  return createPortal(
    <div className="fixed inset-0 z-[250] pointer-events-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in" />

      {/* Floating item ghost */}
      <div
        className="absolute w-20 h-24 -translate-x-1/2 -translate-y-1/2 rounded-lg overflow-hidden border-2 border-wardrobe-accent-gold shadow-2xl shadow-wardrobe-accent-gold/40 rotate-3"
        style={{ left: dragState.x, top: dragState.y }}
      >
        <ItemImage item={dragState.item} alt={dragState.item.name} className="w-full h-full object-cover" />
      </div>

      {/* Drop zones */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-10 bg-gradient-to-t from-ink-900 via-ink-900/95 to-transparent pointer-events-auto">
        <p className="text-center text-xs text-ink-400 mb-4 tracking-wide">
          Drop on a bin to sort this piece
        </p>
        <div className="flex justify-center gap-4 sm:gap-8 max-w-lg mx-auto">
          {ZONES.map((zone) => {
            const Icon = zone.icon;
            const active = dragState.activeZone === zone.id;
            return (
              <div
                key={zone.id}
                ref={(el) => setZoneRef(zone.id, el)}
                className={`flex flex-col items-center gap-2 transition-all duration-200 ${active ? 'scale-105' : ''}`}
              >
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${
                    active ? zone.activeClass : zone.idleClass
                  }`}
                >
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.5} />
                </div>
                <span className={`text-xs font-medium transition-colors ${active ? 'text-ink-100' : 'text-ink-400'}`}>
                  {zone.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
