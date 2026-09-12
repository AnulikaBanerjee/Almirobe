import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import ModalPortal from '@/components/ModalPortal';

interface MenuModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export default function MenuModal({ title, onClose, children, wide }: MenuModalProps) {
  return (
    <ModalPortal onBackdropClick={onClose} zIndex={400}>
      <div
        className={`bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full ${
          wide ? 'max-w-2xl' : 'max-w-md'
        } max-h-[min(90vh,820px)] overflow-hidden flex flex-col animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-700 flex-shrink-0">
          <h3 className="text-lg font-serif text-ink-50">{title}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">{children}</div>
      </div>
    </ModalPortal>
  );
}
