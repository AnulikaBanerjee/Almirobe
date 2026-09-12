import { useState } from 'react';
import { Box, X } from 'lucide-react';
import type { LoftBox } from '@/types';
import PhotoUpload from '@/components/PhotoUpload';
import LoftBoxThumbnail from '@/components/loft/LoftBoxThumbnail';
import ModalPortal from '@/components/ModalPortal';

interface LoftBoxFormModalProps {
  mode: 'create' | 'edit';
  box?: LoftBox;
  onClose: () => void;
  onSave: (box: LoftBox) => void;
}

const inputClass =
  'w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/60 transition-all';

export default function LoftBoxFormModal({ mode, box, onClose, onSave }: LoftBoxFormModalProps) {
  const [name, setName] = useState(box?.name ?? '');
  const [notes, setNotes] = useState(box?.notes ?? '');
  const [imageUrl, setImageUrl] = useState<string | undefined>(box?.imageUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    onSave({
      id: box?.id ?? `loft-${Date.now()}`,
      name: trimmed,
      notes: notes.trim() || undefined,
      imageUrl,
      createdAt: box?.createdAt ?? Date.now(),
    });
    onClose();
  };

  const previewBox: LoftBox = {
    id: 'preview',
    name: name.trim() || 'New box',
    imageUrl,
    createdAt: Date.now(),
  };

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={400}>
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-serif text-ink-50">
              {mode === 'create' ? 'New loft box' : 'Edit box'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg ring-2 ring-amber-800/30">
              <LoftBoxThumbnail box={previewBox} className="w-full h-full" iconClassName="w-10 h-10" />
            </div>
          </div>

          <PhotoUpload
            imageUrl={imageUrl}
            onChange={setImageUrl}
            label="Box photo (for easy searching)"
            enableSmartProcessing={false}
          />

          <div>
            <label className="text-xs text-ink-400 uppercase tracking-wider">Box name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Winter sweaters bag"
              className={`${inputClass} mt-1`}
              required
            />
          </div>

          <div>
            <label className="text-xs text-ink-400 uppercase tracking-wider">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Top shelf, left corner"
              className={`${inputClass} mt-1`}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:bg-ink-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300"
            >
              {mode === 'create' ? 'Create box' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}
