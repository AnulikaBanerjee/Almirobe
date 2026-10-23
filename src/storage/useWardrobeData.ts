import { useCallback, useEffect, useRef, useState } from 'react';
import { createDefaultWardrobeData } from '@/storage/defaults';
import type { WardrobeData, WardrobeStorageProvider } from '@/storage/types';
import type { GiftRecord, Look, LoftBox, WardrobeCollection, WardrobeItem } from '@/types';

const SAVE_DEBOUNCE_MS = 250;

interface UseWardrobeDataResult {
  collections: WardrobeCollection[];
  items: WardrobeItem[];
  looks: Look[];
  loftBoxes: LoftBox[];
  gifts: GiftRecord[];
  activeCollectionId: string;
  isLoading: boolean;
  storageError: string | null;
  setActiveCollectionId: (id: string) => void;
  setCollections: (updater: WardrobeCollection[] | ((prev: WardrobeCollection[]) => WardrobeCollection[])) => void;
  setItems: (updater: WardrobeItem[] | ((prev: WardrobeItem[]) => WardrobeItem[])) => void;
  setLooks: (updater: Look[] | ((prev: Look[]) => Look[])) => void;
  setLoftBoxes: (updater: LoftBox[] | ((prev: LoftBox[]) => LoftBox[])) => void;
  setGifts: (updater: GiftRecord[] | ((prev: GiftRecord[]) => GiftRecord[])) => void;
}

function applyUpdater<T>(prev: T, updater: T | ((current: T) => T)): T {
  return typeof updater === 'function' ? (updater as (current: T) => T)(prev) : updater;
}

export function useWardrobeData(provider: WardrobeStorageProvider): UseWardrobeDataResult {
  const [data, setData] = useState<WardrobeData>(() => createDefaultWardrobeData());
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const hydrated = useRef(false);
  const dirty = useRef(false);
  const dataRef = useRef(data);
  const saveTimer = useRef<number | null>(null);

  dataRef.current = data;

  const persist = useCallback(
    async (snapshot: WardrobeData) => {
      try {
        await provider.save(snapshot);
        dirty.current = false;
        setStorageError(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not save wardrobe changes.';
        setStorageError(message);
      }
    },
    [provider]
  );

  const scheduleSave = useCallback(() => {
    if (!hydrated.current) return;
    dirty.current = true;
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
    }
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      void persist(dataRef.current);
    }, SAVE_DEBOUNCE_MS);
  }, [persist]);

  const flushSave = useCallback(() => {
    if (!hydrated.current || !dirty.current) return;
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    void persist(dataRef.current);
  }, [persist]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const loaded = await provider.load();
        if (cancelled) return;
        setData(loaded ?? createDefaultWardrobeData());
        setStorageError(null);
      } catch {
        if (cancelled) return;
        setData(createDefaultWardrobeData());
        setStorageError('Could not load saved wardrobe data.');
      } finally {
        if (!cancelled) {
          hydrated.current = true;
          dirty.current = false;
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [provider]);

  useEffect(() => {
    if (!hydrated.current) return;
    scheduleSave();
  }, [data, scheduleSave]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        flushSave();
      }
    };
    const onUnload = () => flushSave();

    window.addEventListener('pagehide', onUnload);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      window.removeEventListener('pagehide', onUnload);
      document.removeEventListener('visibilitychange', onHide);
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [flushSave]);

  const patchData = useCallback((patch: Partial<WardrobeData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const setCollections = useCallback(
    (updater: WardrobeCollection[] | ((prev: WardrobeCollection[]) => WardrobeCollection[])) => {
      setData((prev) => ({ ...prev, collections: applyUpdater(prev.collections, updater) }));
    },
    []
  );

  const setItems = useCallback(
    (updater: WardrobeItem[] | ((prev: WardrobeItem[]) => WardrobeItem[])) => {
      setData((prev) => ({ ...prev, items: applyUpdater(prev.items, updater) }));
    },
    []
  );

  const setLooks = useCallback(
    (updater: Look[] | ((prev: Look[]) => Look[])) => {
      setData((prev) => ({ ...prev, looks: applyUpdater(prev.looks, updater) }));
    },
    []
  );

  const setLoftBoxes = useCallback(
    (updater: LoftBox[] | ((prev: LoftBox[]) => LoftBox[])) => {
      setData((prev) => ({ ...prev, loftBoxes: applyUpdater(prev.loftBoxes ?? [], updater) }));
    },
    []
  );

  const setGifts = useCallback(
    (updater: GiftRecord[] | ((prev: GiftRecord[]) => GiftRecord[])) => {
      setData((prev) => ({ ...prev, gifts: applyUpdater(prev.gifts ?? [], updater) }));
    },
    []
  );

  const setActiveCollectionId = useCallback((id: string) => {
    patchData({ activeCollectionId: id });
  }, [patchData]);

  return {
    collections: data.collections,
    items: data.items,
    looks: data.looks,
    loftBoxes: data.loftBoxes ?? [],
    gifts: data.gifts ?? [],
    activeCollectionId: data.activeCollectionId,
    isLoading,
    storageError,
    setActiveCollectionId,
    setCollections,
    setItems,
    setLooks,
    setLoftBoxes,
    setGifts,
  };
}
