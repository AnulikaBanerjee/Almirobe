import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';

interface FieldEditDialogProps {
  open: boolean;
  title: string;
  label?: string;
  value?: string;
  multiline?: boolean;
  children?: ReactNode;
  onClose: () => void;
  onSave: (value: string) => void;
}

export default function FieldEditDialog({
  open,
  title,
  label,
  value,
  multiline,
  children,
  onClose,
  onSave,
}: FieldEditDialogProps) {
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => {
    if (open) setDraft(value ?? '');
  }, [open, value]);

  if (!open) return null;

  const inputClass =
    'w-full bg-[#faf6ee] border border-[#c9b08a] rounded-lg px-3 py-2.5 text-sm text-[#3d2f24] placeholder-[#9a8b78] focus:outline-none focus:border-[#8b5a2b] focus:ring-1 focus:ring-[#8b5a2b]/30';

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={500} backdropClassName="bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-[#f7f0e4] border-2 border-[#c9a96e] rounded-2xl shadow-2xl animate-scale-in ornate-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d4c4a8]">
          <h3 className="text-lg font-serif text-[#3d2f24]">{title}</h3>
          <button type="button" onClick={onClose} className="text-[#7a6a58] hover:text-[#3d2f24]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {children ? (
            children
          ) : (
            <>
              {label && (
                <label className="block text-xs font-medium text-[#6b5a48] uppercase tracking-wider">{label}</label>
              )}
              {multiline ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-y min-h-[100px]`}
                  autoFocus
                />
              ) : (
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              )}
            </>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm text-[#5c4d3d] border border-[#c9b08a] hover:bg-[#ede4d4]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(draft.trim());
                onClose();
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-[#faf6ee] bg-[#6b4423] hover:bg-[#5a381c]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
