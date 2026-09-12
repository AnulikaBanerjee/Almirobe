import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  /** Click backdrop to close */
  onBackdropClick?: () => void;
  zIndex?: number;
  backdropClassName?: string;
}

/**
 * Renders modals on document.body so position:fixed centers on the viewport
 * (not broken by wardrobe transform/overflow ancestors).
 */
export default function ModalPortal({
  children,
  onBackdropClick,
  zIndex = 300,
  backdropClassName = 'bg-black/70 backdrop-blur-md',
}: ModalPortalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 sm:p-6 animate-fade-in ${backdropClassName}`}
      style={{ zIndex }}
      onClick={onBackdropClick}
      role="presentation"
    >
      {children}
    </div>,
    document.body
  );
}
