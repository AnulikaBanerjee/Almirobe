import { ArrowLeft, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import OrnatePageFrame from '@/components/layout/OrnatePageFrame';

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
  iconClassName = 'text-[#8b6914]',
  onBack,
  children,
  wide,
}: AppPageShellProps) {
  return (
    <OrnatePageFrame className={wide ? 'max-w-6xl' : 'max-w-4xl'}>
      <div className="flex items-center gap-3 mb-5 sticky top-0 z-10 bg-[#faf4e8]/90 backdrop-blur-sm pb-2 -mx-1 px-1">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-[#c9b08a] bg-[#faf6ee] text-[#6b5a48] hover:text-[#3d2f24] hover:border-[#8b6914] transition-all flex items-center justify-center flex-shrink-0"
          aria-label="Back to wardrobes"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-serif text-[#3d2f24] flex items-center gap-2">
            <Icon className={`w-6 h-6 ${iconClassName}`} />
            {title}
          </h2>
          {subtitle && <p className="text-xs text-[#7a6a58] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="text-[#3d2f24]">{children}</div>
    </OrnatePageFrame>
  );
}
