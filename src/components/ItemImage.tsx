import { useEffect, useState } from 'react';
import type { WardrobeItem } from '@/types';
import { getItemImageRef } from '@/images/itemImage';
import { useImageStorage } from '@/images';

interface ItemImageProps {
  item: WardrobeItem;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export default function ItemImage({ item, alt, className, fallbackClassName }: ItemImageProps) {
  const imageStorage = useImageStorage();
  const ref = getItemImageRef(item);
  const [src, setSrc] = useState<string | null>(
    ref?.startsWith('data:') || ref?.startsWith('http') || ref?.startsWith('/uploads/')
      ? ref
      : null
  );

  useEffect(() => {
    if (!ref) {
      setSrc(null);
      return;
    }
    if (ref.startsWith('data:') || ref.startsWith('http') || ref.startsWith('/uploads/')) {
      setSrc(ref);
      return;
    }

    let objectUrl: string | null = null;
    void imageStorage.resolveUrl(ref).then((url) => {
      if (!url) {
        setSrc(null);
        return;
      }
      if (url.startsWith('blob:')) objectUrl = url;
      setSrc(url);
    });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ref, imageStorage]);

  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div
      className={fallbackClassName ?? className}
      style={{
        background: `linear-gradient(145deg, ${item.colorHex} 0%, ${item.colorHex}cc 60%, ${item.colorHex}88 100%)`,
      }}
    />
  );
}
