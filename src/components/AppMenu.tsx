import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftRight,
  ClipboardList,
  HeartHandshake,
  History,
  Menu,
  Package,
  ShoppingBag,
  Truck,
  User,
  Warehouse,
} from 'lucide-react';
import type { AuthUser } from '@/auth';
import type { MenuPage } from '@/navigation';
import { ensureProfilesForUser, type StoredProfile } from '@/menu/menuStorage';
import SwitchProfilePopover from '@/components/menu/SwitchProfilePopover';

interface AppMenuProps {
  user: AuthUser;
  onNavigate: (page: MenuPage) => void;
  onSwitchProfile: (profile: AuthUser) => void;
}

type MenuEntryId = MenuPage | 'switch-profile' | 'professional-help' | 'donation-pickup';

type MenuEntry = {
  id: MenuEntryId;
  label: string;
  icon: typeof User;
  disabled?: boolean;
  soon?: boolean;
};

const MENU_ITEMS: MenuEntry[] = [
  { id: 'account', label: 'Account Details', icon: User },
  { id: 'switch-profile', label: 'Switch Profile', icon: ArrowLeftRight },
  { id: 'account-history', label: 'Account History', icon: History },
  { id: 'purchase-report', label: 'Cloth Purchase Report', icon: ShoppingBag },
  { id: 'declutter-report', label: 'Declutter Report', icon: ClipboardList },
  { id: 'donation-box', label: 'Donation Box', icon: Package },
  { id: 'the-loft', label: 'The Loft', icon: Warehouse },
  { id: 'professional-help', label: 'Request Professional Help', icon: HeartHandshake, disabled: true, soon: true },
  { id: 'donation-pickup', label: 'Request Cloth Donation Pickup', icon: Truck, disabled: true, soon: true },
];

function clampMenuPosition(top: number, left: number, width: number) {
  const margin = 8;
  const maxLeft = window.innerWidth - width - margin;
  return {
    top: Math.max(margin, top),
    left: Math.max(margin, Math.min(left, maxLeft)),
  };
}

export default function AppMenu({ user, onNavigate, onSwitchProfile }: AppMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profiles, setProfiles] = useState<StoredProfile[]>(() => ensureProfilesForUser(user));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!menuOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = 288;
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = rect.right - width;
    }
    setMenuPos(clampMenuPosition(rect.bottom + 6, left, width));
  }, [menuOpen]);

  useEffect(() => {
    setProfiles(ensureProfilesForUser(user));
  }, [user]);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [menuOpen]);

  const handleMenuToggle = () => {
    if (profileOpen) {
      setProfileOpen(false);
      return;
    }
    setMenuOpen((v) => !v);
  };

  const handleSelect = (item: MenuEntry) => {
    if (item.disabled) return;
    setMenuOpen(false);
    if (item.id === 'switch-profile') {
      setProfileOpen(true);
      return;
    }
    setProfileOpen(false);
    onNavigate(item.id as MenuPage);
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleMenuToggle}
          className="w-10 h-10 rounded-lg bg-gradient-to-br from-wardrobe-accent-gold to-amber-700 flex items-center justify-center shadow-lg shadow-wardrobe-accent-gold/20 hover:brightness-110 transition-all"
          aria-label="Open menu"
          aria-expanded={menuOpen || profileOpen}
          title="Menu"
        >
          <Menu className="w-5 h-5 text-ink-900" />
        </button>

        {menuOpen &&
          createPortal(
            <div
              ref={menuRef}
              className="fixed z-[200] w-72 rounded-xl border border-ink-700 bg-ink-800 shadow-2xl py-1 animate-scale-in origin-top-left"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
                      item.disabled
                        ? 'text-ink-600 cursor-not-allowed'
                        : 'text-ink-200 hover:bg-ink-700/50 hover:text-ink-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </span>
                    {item.soon && (
                      <span className="text-[9px] uppercase tracking-wider text-ink-600">Soon</span>
                    )}
                  </button>
                );
              })}
            </div>,
            document.body
          )}
      </div>

      {profileOpen && (
        <SwitchProfilePopover
          anchorRef={buttonRef}
          user={user}
          profiles={profiles}
          onClose={() => setProfileOpen(false)}
          onSwitch={onSwitchProfile}
        />
      )}
    </>
  );
}
