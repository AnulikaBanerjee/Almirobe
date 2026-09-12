import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createImageProvider } from '@/images/createImageProvider';
import type { ImageStorageProvider } from '@/images/types';

const ImageStorageContext = createContext<ImageStorageProvider | null>(null);

export function AppImageStorageProvider({ children }: { children: ReactNode }) {
  const provider = useMemo(() => createImageProvider('auto'), []);
  return (
    <ImageStorageContext.Provider value={provider}>{children}</ImageStorageContext.Provider>
  );
}

export function useImageStorage(): ImageStorageProvider {
  const ctx = useContext(ImageStorageContext);
  if (!ctx) throw new Error('useImageStorage must be used within ImageStorageProvider');
  return ctx;
}
