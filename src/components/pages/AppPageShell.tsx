import { ArrowLeft, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface AppPageShellProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconClassName?: string;
  onBack: () => void;
  children: ReactNode;
  wide?: boolean;
}

export default function AppPageShell({
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'text-wardrobe-accent-gold',
  onBack,
  children,
  wide,
}: AppPageShellProps) {
  return (
    <div className={`w-full animate-fade-in-up ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-ink-700 bg-ink-800/60 text-ink-400 hover:text-ink-100 hover:border-ink-600 transition-all flex items-center justify-center flex-shrink-0"
          aria-label="Back to wardrobes"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-serif text-ink-50 flex items-center gap-2">
            <Icon className={`w-6 h-6 ${iconClassName}`} />
            {title}
          </h2>
          {subtitle && <p className="text-xs text-ink-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="rounded-2xl border border-ink-700/50 bg-ink-800/40 p-5 sm:p-6">{children}</div>
    </div>
  );
}
