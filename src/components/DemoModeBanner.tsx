import { Info } from 'lucide-react';

export default function DemoModeBanner() {
  return (
    <div
      role="status"
      className="relative z-20 px-4 py-2 text-center text-xs text-sky-100 bg-sky-950/50 border-b border-sky-800/40 flex items-center justify-center gap-2"
    >
      <Info className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
      <span>
        <strong className="font-medium text-sky-200">Demo mode</strong>
        {' — '}
        sign-in is simulated locally. Your wardrobe is saved on this device only.
      </span>
    </div>
  );
}
