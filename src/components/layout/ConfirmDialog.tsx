import { X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={520} backdropClassName="bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-sm bg-[#f7f0e4] border-2 border-[#c9a96e] rounded-2xl shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d4c4a8]">
          <h3 className="text-lg font-serif text-[#3d2f24]">{title}</h3>
          <button type="button" onClick={onClose} className="text-[#7a6a58] hover:text-[#3d2f24]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#5c4d3d]">{message}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm text-[#5c4d3d] border border-[#c9b08a] hover:bg-[#ede4d4]"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-[#faf6ee] bg-[#8b3d1a] hover:bg-[#6f2f14]"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
