import { MessageCircle, MonitorUp, Send, Users } from 'lucide-react';
import AppPageShell from '@/components/pages/AppPageShell';

interface PlanWithFriendsPageProps {
  onBack: () => void;
}

const PLACEHOLDER_MESSAGES = [
  { id: '1', from: 'them', name: 'Aisha', text: 'What about the rust kurta with your beige trousers?' },
  { id: '2', from: 'me', name: 'You', text: 'Yes — and the gold juttis from last Diwali.' },
  { id: '3', from: 'them', name: 'Aisha', text: 'Share your screen when you pull the look board open?' },
];

const PLACEHOLDER_BOARD = [
  { id: 'a', label: 'Rust kurta' },
  { id: 'b', label: 'Beige trousers' },
  { id: 'c', label: 'Gold juttis' },
];

export default function PlanWithFriendsPage({ onBack }: PlanWithFriendsPageProps) {
  return (
    <AppPageShell
      title="Plan With Friends"
      subtitle="Co-plan outfits with another Almirobe user — UI preview"
      icon={Users}
      iconClassName="text-violet-500"
      onBack={onBack}
      wide
    >
      <div className="mb-4 rounded-xl border border-violet-200/70 bg-violet-50/60 px-3 py-2.5 text-xs text-[#5c4d6b]">
        Static layout only. Live chat, invites, and screen share will land in a later release.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-3 min-h-[420px]">
        {/* Shared board (Create Look–like surface) */}
        <section className="rounded-2xl border border-amber-100 bg-[#fffdf8] flex flex-col overflow-hidden min-h-[320px]">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-amber-100">
            <div>
              <p className="text-sm font-medium text-ink-800">Shared look board</p>
              <p className="text-[11px] text-ink-500">Drag pieces here when collaboration is live</p>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border border-amber-200 text-ink-400 cursor-not-allowed"
            >
              <MonitorUp className="w-3.5 h-3.5" />
              Share screen
            </button>
          </div>
          <div className="flex-1 relative p-4 bg-[radial-gradient(circle_at_30%_20%,rgba(201,169,110,0.12),transparent_45%),linear-gradient(180deg,#faf6ee,#f4ead8)]">
            <div className="absolute inset-0 opacity-[0.35] pointer-events-none [background-image:linear-gradient(rgba(139,105,20,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(139,105,20,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="relative flex flex-wrap gap-3 content-start">
              {PLACEHOLDER_BOARD.map((piece, index) => (
                <div
                  key={piece.id}
                  className="w-28 rounded-xl border border-amber-200/80 bg-white/80 shadow-sm overflow-hidden"
                  style={{ transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)` }}
                >
                  <div className="aspect-square bg-gradient-to-br from-amber-100 to-rose-100" />
                  <p className="px-2 py-1.5 text-[10px] text-ink-700 truncate">{piece.label}</p>
                </div>
              ))}
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-ink-400">
              Invite a friend to edit this board together
            </p>
          </div>
        </section>

        {/* Chat panel */}
        <section className="rounded-2xl border border-amber-100 bg-white/80 flex flex-col overflow-hidden min-h-[320px]">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-amber-100">
            <MessageCircle className="w-4 h-4 text-violet-500" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-800 truncate">Chat with Aisha</p>
              <p className="text-[10px] text-emerald-600">Offline preview</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {PLACEHOLDER_MESSAGES.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    msg.from === 'me'
                      ? 'bg-[#6b4423] text-[#faf6ee] rounded-br-md'
                      : 'bg-amber-50 text-ink-800 border border-amber-100 rounded-bl-md'
                  }`}
                >
                  {msg.from !== 'me' && (
                    <p className="text-[10px] font-medium text-violet-600 mb-0.5">{msg.name}</p>
                  )}
                  <p className="leading-snug">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 border-t border-amber-100 flex gap-2">
            <input
              disabled
              placeholder="Message (coming soon)"
              className="flex-1 rounded-xl border border-amber-200 bg-[#faf6ee] px-3 py-2 text-sm text-ink-400 cursor-not-allowed"
            />
            <button
              type="button"
              disabled
              className="w-10 h-10 rounded-xl bg-amber-100 text-ink-400 flex items-center justify-center cursor-not-allowed"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </AppPageShell>
  );
}
