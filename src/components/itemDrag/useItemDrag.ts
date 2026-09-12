import { useCallback, useEffect, useRef, useState } from 'react';
import type { WardrobeItem } from '@/types';
import type { DropZoneId, ItemDragState } from '@/components/itemDrag/types';

const DRAG_THRESHOLD_PX = 10;

interface UseItemDragOptions {
  onOpenDetail: (item: WardrobeItem) => void;
  onSendToLaundry: (item: WardrobeItem) => void;
  onMarkDonation: (item: WardrobeItem) => void;
  onDelete: (item: WardrobeItem) => void;
}

function hitTestZone(
  x: number,
  y: number,
  zones: Partial<Record<DropZoneId, DOMRect>>
): DropZoneId | null {
  for (const id of ['laundry', 'donation', 'delete'] as DropZoneId[]) {
    const rect = zones[id];
    if (!rect) continue;
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return id;
    }
  }
  return null;
}

export function useItemDrag({
  onOpenDetail,
  onSendToLaundry,
  onMarkDonation,
  onDelete,
}: UseItemDragOptions) {
  const [dragState, setDragState] = useState<ItemDragState | null>(null);
  const zoneRefs = useRef<Partial<Record<DropZoneId, HTMLDivElement | null>>>({});
  const pendingRef = useRef<{
    item: WardrobeItem;
    startX: number;
    startY: number;
    pointerId: number;
    dragging: boolean;
  } | null>(null);

  const setZoneRef = useCallback((id: DropZoneId, el: HTMLDivElement | null) => {
    zoneRefs.current[id] = el;
  }, []);

  const getZoneRects = useCallback(() => {
    const rects: Partial<Record<DropZoneId, DOMRect>> = {};
    for (const id of ['laundry', 'donation', 'delete'] as DropZoneId[]) {
      const el = zoneRefs.current[id];
      if (el) rects[id] = el.getBoundingClientRect();
    }
    return rects;
  }, []);

  const finishDrag = useCallback(
    (x: number, y: number) => {
      const pending = pendingRef.current;
      if (!pending) return;

      if (pending.dragging) {
        const zone = hitTestZone(x, y, getZoneRects());
        if (zone === 'laundry') onSendToLaundry(pending.item);
        else if (zone === 'donation') onMarkDonation(pending.item);
        else if (zone === 'delete') onDelete(pending.item);
      } else {
        onOpenDetail(pending.item);
      }

      pendingRef.current = null;
      setDragState(null);
    },
    [getZoneRects, onDelete, onMarkDonation, onOpenDetail, onSendToLaundry]
  );

  const onItemPointerDown = useCallback((e: React.PointerEvent, item: WardrobeItem) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pendingRef.current = {
      item,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      dragging: false,
    };
  }, []);

  const onItemPointerMove = useCallback((e: React.PointerEvent) => {
    const pending = pendingRef.current;
    if (!pending || e.pointerId !== pending.pointerId) return;

    const dx = e.clientX - pending.startX;
    const dy = e.clientY - pending.startY;
    const distance = Math.hypot(dx, dy);

    if (!pending.dragging && distance >= DRAG_THRESHOLD_PX) {
      pending.dragging = true;
    }

    if (pending.dragging) {
      const activeZone = hitTestZone(e.clientX, e.clientY, getZoneRects());
      setDragState({
        item: pending.item,
        x: e.clientX,
        y: e.clientY,
        activeZone,
      });
    }
  }, [getZoneRects]);

  const onItemPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending || e.pointerId !== pending.pointerId) return;
      finishDrag(e.clientX, e.clientY);
    },
    [finishDrag]
  );

  const onItemPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending || e.pointerId !== pending.pointerId) return;
      pendingRef.current = null;
      setDragState(null);
    },
    []
  );

  useEffect(() => {
    if (!dragState) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [dragState]);

  const draggingItemId = dragState?.item.id ?? null;

  return {
    dragState,
    draggingItemId,
    setZoneRef,
    onItemPointerDown,
    onItemPointerMove,
    onItemPointerUp,
    onItemPointerCancel,
  };
}
