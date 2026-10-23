import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { AuthUser } from '@/auth';
import type { StoredProfile } from '@/menu/menuStorage';

function profileInitial(label: string): string {
  return (label.trim()[0] ?? '?').toUpperCase();
}

function profileHue(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return `${Math.abs(hash % 360)}`;
}

interface SwitchProfilePanelProps {
  user: AuthUser;
  profiles: StoredProfile[];
  onSwitch: (profile: AuthUser) => void;
  onAdd: (label: string) => void;
  onRequestDelete: (profile: StoredProfile) => void;
}

export default function SwitchProfilePanel({
  user,
  profiles,
  onSwitch,
  onAdd,
  onRequestDelete,
}: SwitchProfilePanelProps) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const submitAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    onAdd(label);
    setNewLabel('');
    setAdding(false);
  };

  return (
    <div className="space-y-1">
      {profiles.map((profile) => {
        const active = profile.id === user.id;
        const hue = profileHue(profile.id);
        const canDelete = profiles.length > 1 && !active;
        return (
          <div
            key={profile.id}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl ${
              active ? 'bg-ink-700/40' : 'hover:bg-ink-700/25'
            }`}
          >
            <button
              type="button"
              onClick={() => onSwitch(profile)}
              className="flex-1 flex items-center gap-3 min-w-0 text-left"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 ring-2 ring-offset-2 ring-offset-ink-800 ${
                  active ? 'ring-wardrobe-accent-gold' : 'ring-transparent'
                }`}
                style={{
                  background: `linear-gradient(135deg, hsl(${hue} 55% 45%), hsl(${hue} 65% 35%))`,
                }}
              >
                {profileInitial(profile.label)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-100 truncate">{profile.label}</p>
                <p className="text-xs text-ink-500 truncate">
                  {profile.email?.split('@')[0] ?? profile.id}
                </p>
              </div>
              {active && <Check className="w-5 h-5 text-wardrobe-accent-gold flex-shrink-0" strokeWidth={2.5} />}
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => onRequestDelete(profile)}
                className="p-2 text-ink-500 hover:text-red-400 flex-shrink-0"
                aria-label={`Delete ${profile.label}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}

      {adding ? (
        <div className="px-2 pt-2 space-y-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitAdd();
              }
            }}
            placeholder="Profile name"
            className="w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/60"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewLabel('');
              }}
              className="flex-1 py-1.5 rounded-lg text-xs text-ink-400 border border-ink-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitAdd}
              disabled={!newLabel.trim()}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium text-ink-900 bg-wardrobe-accent-gold disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 mt-1 rounded-xl text-sm text-ink-300 hover:bg-ink-700/25 hover:text-ink-50"
        >
          <Plus className="w-4 h-4" />
          Add profile
        </button>
      )}
    </div>
  );
}
