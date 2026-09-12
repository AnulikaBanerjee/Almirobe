import { useState } from 'react';
import { User } from 'lucide-react';
import type { AuthUser } from '@/auth';
import type { WardrobeCollection, WardrobeItem } from '@/types';
import AppPageShell from '@/components/pages/AppPageShell';
import { ensureProfilesForUser, updateProfileName } from '@/menu/menuStorage';

interface AccountPageProps {
  user: AuthUser;
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  onBack: () => void;
  onUpdateUser: (user: AuthUser) => void;
  onSignOut: () => void;
}

const inputClass =
  'w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/60 transition-all';

export default function AccountPage({
  user,
  items,
  collections,
  onBack,
  onUpdateUser,
  onSignOut,
}: AccountPageProps) {
  const [displayName, setDisplayName] = useState(user.displayName ?? '');
  const [message, setMessage] = useState('');

  const save = () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    updateProfileName(user.id, trimmed);
    onUpdateUser({ ...user, displayName: trimmed });
    ensureProfilesForUser({ ...user, displayName: trimmed });
    setMessage('Account details saved.');
  };

  return (
    <AppPageShell
      title="Account Details"
      subtitle="Manage your profile and wardrobe summary"
      icon={User}
      onBack={onBack}
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs text-ink-400 uppercase tracking-wider">Display name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={`${inputClass} mt-1`} />
        </div>
        <div>
          <label className="text-xs text-ink-400 uppercase tracking-wider">Email</label>
          <p className="text-sm text-ink-200 mt-1">{user.email ?? '—'}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-3">
            <p className="text-ink-500">Wardrobes</p>
            <p className="text-xl text-ink-100 font-medium">{collections.length}</p>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-3">
            <p className="text-ink-500">Items</p>
            <p className="text-xl text-ink-100 font-medium">{items.length}</p>
          </div>
        </div>
        {message && <p className="text-xs text-emerald-400">{message}</p>}
        <button
          type="button"
          onClick={save}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-ink-300 border border-ink-700 hover:bg-ink-700/50"
        >
          Sign Out
        </button>
      </div>
    </AppPageShell>
  );
}
