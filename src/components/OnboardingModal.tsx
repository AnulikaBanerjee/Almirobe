import { Briefcase, Sparkles } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';

interface OnboardingModalProps {
  onSetupSelf: () => void;
}

export default function OnboardingModal({ onSetupSelf }: OnboardingModalProps) {
  return (
    <ModalPortal zIndex={450} backdropClassName="bg-black/75 backdrop-blur-md">
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-wardrobe-accent-gold to-amber-700 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-ink-900" />
        </div>
        <h2 className="font-serif text-2xl text-ink-50 mb-2">Welcome to My Wardrobe</h2>
        <p className="text-sm text-ink-400 mb-8 leading-relaxed">
          How would you like to get started? You can organize your wardrobe yourself or book help from a
          professional stylist.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-ink-500 bg-ink-900/50 border border-ink-700/60 cursor-not-allowed opacity-60"
          >
            <Briefcase className="w-4 h-4" />
            Book Professional Help
          </button>

          <div className="flex items-center gap-3 text-ink-600 text-xs uppercase tracking-widest">
            <span className="flex-1 h-px bg-ink-700" />
            OR
            <span className="flex-1 h-px bg-ink-700" />
          </div>

          <button
            type="button"
            onClick={onSetupSelf}
            className="w-full py-3 rounded-xl text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all"
          >
            Setup Wardrobe Yourself
          </button>
        </div>

        <p className="text-[10px] text-ink-600 mt-6">Professional help will be available in a future release.</p>
      </div>
    </ModalPortal>
  );
}
