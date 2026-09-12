import { Box } from 'lucide-react';
import type { LoftBox } from '@/types';

interface LoftBoxThumbnailProps {
  box: LoftBox;
  className?: string;
  iconClassName?: string;
}

export default function LoftBoxThumbnail({ box, className = '', iconClassName = 'w-8 h-8' }: LoftBoxThumbnailProps) {
  if (box.imageUrl) {
    return (
      <img
        src={box.imageUrl}
        alt={box.name}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-amber-950/40 border border-amber-800/30 ${className}`}>
      <Box className={`text-amber-600/70 ${iconClassName}`} strokeWidth={1.25} />
    </div>
  );
}
