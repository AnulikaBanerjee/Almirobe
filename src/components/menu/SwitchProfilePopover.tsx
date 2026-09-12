import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { AuthUser } from '@/auth';
import type { StoredProfile } from '@/menu/menuStorage';
import SwitchProfilePanel from '@/components/menu/SwitchProfilePanel';

interface SwitchProfilePopoverProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  user: AuthUser;
  profiles: StoredProfile[];
  onClose: () => void;
  onSwitch: (profile: AuthUser) => void;
}

function clampPosition(top: number, left: number, width: number, height: number) {
  const margin = 8;
  const maxLeft = window.innerWidth - width - margin;
  const maxTop = window.innerHeight - height - margin;
  return {
    top: Math.max(margin, Math.min(top, maxTop)),
    left: Math.max(margin, Math.min(left, maxLeft)),
  };
}

export default function SwitchProfilePopover({
  anchorRef,
  user,
  profiles,
  onClose,
  onSwitch,
}: SwitchProfilePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchor || !popover) return;

    const rect = anchor.getBoundingClientRect();
    const width = 288;
    const height = popover.offsetHeight || 280;
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = rect.right - width;
    }
    setPos(clampPosition(rect.bottom + 8, left, width, height));
  }, [anchorRef, profiles.length]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[210] w-72 rounded-xl border border-ink-700 bg-ink-800 shadow-2xl animate-scale-in origin-top-left"
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
      aria-label="Switch profile"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700">
        <p className="text-sm font-medium text-ink-100">Switch Profile</p>
        <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-200">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-2 max-h-[min(60vh,400px)] overflow-y-auto custom-scrollbar">
        <SwitchProfilePanel
          user={user}
          profiles={profiles}
          onSwitch={(profile) => {
            onSwitch(profile);
            onClose();
          }}
        />
      </div>
    </div>,
    document.body
  );
}
