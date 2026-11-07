import type { ReactNode } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import OrnatePageFrame from '@/components/layout/OrnatePageFrame';

interface DesignSplitLayoutProps {
  artSrc: string;
  artAlt: string;
  children: ReactNode;
  onBack?: () => void;
  onLogout?: () => void;
  tall?: boolean;
}

export function LotusDivider() {
  return (
    <div className="flex items-center gap-3 mb-3" aria-hidden="true">
      <div className="flex-1 h-px bg-[#c9b08a]/80" />
      <span className="text-[#8b6914] text-lg leading-none">✿</span>
      <div className="flex-1 h-px bg-[#c9b08a]/80" />
    </div>
  );
}

export default function DesignSplitLayout({
  artSrc,
  artAlt,
  children,
  onBack,
  onLogout,
  tall,
}: DesignSplitLayoutProps) {
  return (
    <OrnatePageFrame tall={tall} className="max-w-6xl">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute z-20 w-8 h-8 rounded-full border border-[#c9b08a] bg-[#faf6ee]/90 text-[#6b5a48] hover:text-[#3d2f24] flex items-center justify-center top-2 left-2"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="absolute z-20 top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#c9b08a] bg-[#faf6ee]/90 text-[#6b5a48] hover:text-[#3d2f24] text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      )}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-4 items-stretch min-h-0">
        <div className="design-art rounded-xl">
          <img src={artSrc} alt={artAlt} />
        </div>
        <div className="px-1 sm:px-4 lg:px-6 py-2 lg:py-6 flex flex-col justify-center text-[#3d2f24]">
          {children}
        </div>
      </div>
    </OrnatePageFrame>
  );
}
