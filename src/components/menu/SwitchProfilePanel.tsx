import { Check } from 'lucide-react';
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
}

export default function SwitchProfilePanel({ user, profiles, onSwitch }: SwitchProfilePanelProps) {
  return (
    <div className="space-y-1">
      {profiles.map((profile) => {
        const active = profile.id === user.id;
        const hue = profileHue(profile.id);
        return (
          <button
            key={profile.id}
            type="button"
            onClick={() => onSwitch(profile)}
            className={`w-full flex items-center gap-3 px-2 py-3 rounded-xl transition-all text-left ${
              active ? 'bg-ink-700/40' : 'hover:bg-ink-700/25'
            }`}
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
        );
      })}
    </div>
  );
}
