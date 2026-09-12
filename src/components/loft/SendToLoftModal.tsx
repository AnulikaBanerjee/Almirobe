import { X } from 'lucide-react';
import type { LoftBox } from '@/types';
import LoftBoxThumbnail from '@/components/loft/LoftBoxThumbnail';
import ModalPortal from '@/components/ModalPortal';

interface SendToLoftModalProps {
  itemName: string;
  loftBoxes: LoftBox[];
  onClose: () => void;
  onSelectBox: (boxId: string) => void;
  onCreateBox?: () => void;
}

export default function SendToLoftModal({
  itemName,
  loftBoxes,
  onClose,
  onSelectBox,
  onCreateBox,
}: SendToLoftModalProps) {
  return (
    <ModalPortal onBackdropClick={onClose} zIndex={450}>
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <div>
            <h3 className="text-lg font-serif text-ink-50">Pack into loft</h3>
            <p className="text-xs text-ink-500 mt-0.5 truncate max-w-[240px]">{itemName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {loftBoxes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-ink-400 mb-4">Create a loft box first.</p>
              {onCreateBox && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateBox();
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300"
                >
                  Go to The Loft
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {loftBoxes.map((box) => (
                <button
                  key={box.id}
                  type="button"
                  onClick={() => {
                    onSelectBox(box.id);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 p-2 rounded-xl border border-ink-700/50 hover:border-amber-500/50 hover:bg-amber-950/20 transition-all"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden">
                    <LoftBoxThumbnail box={box} className="w-full h-full" iconClassName="w-8 h-8" />
                  </div>
                  <span className="text-[10px] text-ink-300 text-center line-clamp-2 leading-tight">{box.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
