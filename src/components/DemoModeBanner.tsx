import { Info } from 'lucide-react';

export default function DemoModeBanner() {
  return (
    <div
      role="status"
      className="relative z-20 px-4 py-2 text-center text-xs text-amber-900 bg-amber-50/90 border-b border-amber-200/70 flex items-center justify-center gap-2"
    >
      <Info className="w-3.5 h-3.5 text-wardrobe-accent-gold flex-shrink-0" />
      <span>
        <strong className="font-medium">Demo mode</strong>
        {' — '}
        sign-in is simulated locally. Your wardrobe is saved on this device only.
      </span>
    </div>
  );
}
