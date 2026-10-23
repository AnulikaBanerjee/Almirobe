import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Link2,
  Sparkles,
  Trash2,
  Shirt,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { apiClient } from '@/api/client';
import { localCutout } from '@/imageJobs/localFallback';
import { persistImageUrl } from '@/images/persistImage';
import { useImageStorage, type ImageStorageProvider } from '@/images';
import { buildLookFromDraft, getLookMemberIds } from '@/looks';
import type { LookEditorContext } from '@/looks/types';
import type { LookPieceLayout, WardrobeItem, WardrobeCollection, Look } from '@/types';
import ItemImage from '@/components/ItemImage';

const DEFAULT_PIECE = 112;
const MIN_PIECE = 56;
const CANVAS_PAD = 12;
const DRAG_THRESHOLD_PX = 10;

type MoveDragSession = {
  kind: 'move';
  pieceKey: string;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  dragging: boolean;
};

type ResizeDragSession = {
  kind: 'resize';
  pieceKey: string;
  pointerId: number;
  startW: number;
  startH: number;
  originX: number;
  originY: number;
};

type DragSession = MoveDragSession | ResizeDragSession;

type PieceBox = { x: number; y: number; w: number; h: number };

type WardrobeCanvasPiece = PieceBox & {
  key: string;
  kind: 'wardrobe';
  itemId: string;
};

type ExternalCanvasPiece = PieceBox & {
  key: string;
  kind: 'external';
  imageUrl: string;
  label: string;
};

type CanvasPiece = WardrobeCanvasPiece | ExternalCanvasPiece;

interface CreateLookPageProps {
  editor: LookEditorContext;
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  onBack: () => void;
  onSave: (look: Look) => void;
}

function categoryLabelForItem(
  collections: WardrobeCollection[],
  item: WardrobeItem
): string {
  const collection = collections.find((c) => c.id === item.collectionId);
  return collection?.categories.find((c) => c.id === item.categoryId)?.label ?? 'Other';
}

function defaultPieceBox(index: number): PieceBox {
  const col = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: CANVAS_PAD + col * (DEFAULT_PIECE + 16),
    y: 16 + row * (DEFAULT_PIECE + 12),
    w: DEFAULT_PIECE,
    h: DEFAULT_PIECE,
  };
}

function piecesFromLayout(layout: LookPieceLayout[], canvasW: number, canvasH: number): CanvasPiece[] {
  return [...layout]
    .sort((a, b) => a.z - b.z)
    .map((entry, index) => {
      const box: PieceBox = {
        x: entry.x * canvasW,
        y: entry.y * canvasH,
        w: Math.max(MIN_PIECE, entry.w * canvasW),
        h: Math.max(MIN_PIECE, entry.h * canvasH),
      };
      if (entry.itemId) {
        return {
          key: `w-${entry.itemId}`,
          kind: 'wardrobe' as const,
          itemId: entry.itemId,
          ...box,
        };
      }
      return {
        key: `ext-${index}-${entry.z}`,
        kind: 'external' as const,
        imageUrl: entry.imageUrl ?? '',
        label: entry.label ?? 'Online item',
        ...box,
      };
    })
    .filter((piece) => piece.kind === 'wardrobe' || piece.imageUrl);
}

function layoutFromPieces(pieces: CanvasPiece[], canvasW: number, canvasH: number): LookPieceLayout[] {
  const width = Math.max(canvasW, 1);
  const height = Math.max(canvasH, 1);
  return pieces.map((piece, z) => ({
    itemId: piece.kind === 'wardrobe' ? piece.itemId : undefined,
    imageUrl: piece.kind === 'external' ? piece.imageUrl : undefined,
    label: piece.kind === 'external' ? piece.label : undefined,
    x: piece.x / width,
    y: piece.y / height,
    w: piece.w / width,
    h: piece.h / height,
    z,
  }));
}

function buildInitialPieces(editor: LookEditorContext, allItems: WardrobeItem[]): CanvasPiece[] {
  if (editor.existingLook?.layout?.length) {
    return piecesFromLayout(editor.existingLook.layout, 800, 520);
  }
  if (editor.existingLook) {
    const members = getLookMemberIds(editor.existingLook)
      .map((id) => allItems.find((i) => i.id === id))
      .filter((i): i is WardrobeItem => i !== undefined);
    return members.map((item, index) => ({
      key: `w-${item.id}`,
      kind: 'wardrobe' as const,
      itemId: item.id,
      ...defaultPieceBox(index),
    }));
  }
  if (editor.primaryItem) {
    return [
      {
        key: `w-${editor.primaryItem.id}`,
        kind: 'wardrobe',
        itemId: editor.primaryItem.id,
        ...defaultPieceBox(0),
      },
    ];
  }
  return [];
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Ghost mannequin when configured, then wardrobe cutout job, then local pipeline. */
async function extractGarmentFile(file: File, imageStorage: ImageStorageProvider): Promise<string> {
  try {
    const ghostPng = await apiClient.extractGarmentGhost(file);
    const ghostUrl = URL.createObjectURL(ghostPng);
    try {
      const stored = await persistImageUrl(imageStorage, ghostUrl);
      if (stored) return stored;
    } finally {
      URL.revokeObjectURL(ghostUrl);
    }
  } catch {
    // Ghost worker may be offline; fall through to rembg job / local cutout.
  }
  try {
    const job = await apiClient.processGarmentImage(file);
    const done =
      job.cutoutStatus === 'succeeded' && job.processedUrl
        ? job
        : await apiClient.pollImageJob(job.id);
    if (done.cutoutStatus === 'succeeded' && done.processedUrl) {
      return done.processedUrl;
    }
  } catch {
    // Fall through to the in-browser pipeline used when the API cutout is unavailable.
  }
  const cutout = await localCutout(file);
  const stored = await persistImageUrl(imageStorage, cutout.url);
  if (!stored) throw new Error('Could not extract the garment from that link');
  return stored;
}

export default function CreateLookPage({
  editor,
  allItems,
  allCollections,
  onBack,
  onSave,
}: CreateLookPageProps) {
  const isEditing = Boolean(editor.existingLook);
  const canvasRef = useRef<HTMLDivElement>(null);
  const binRef = useRef<HTMLDivElement>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const detachWindowDragRef = useRef<(() => void) | null>(null);

  const [lookName, setLookName] = useState(editor.existingLook?.name ?? '');
  const [lookDetails, setLookDetails] = useState(editor.existingLook?.notes ?? '');
  const [pieces, setPieces] = useState<CanvasPiece[]>(() => buildInitialPieces(editor, allItems));
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const imageStorage = useImageStorage();
  const layoutFitted = useRef(false);

  const [moveOverlay, setMoveOverlay] = useState<{
    key: string;
    clientX: number;
    clientY: number;
  } | null>(null);
  const [binHot, setBinHot] = useState(false);
  const [needsLandscape, setNeedsLandscape] = useState(false);

  const wardrobePool = useMemo(
    () => allItems.filter((item) => !item.loftBoxId && !item.inLaundry),
    [allItems]
  );

  const categoryTabs = useMemo(() => {
    const labels = new Set<string>();
    for (const item of wardrobePool) {
      labels.add(categoryLabelForItem(allCollections, item));
    }
    return ['all', ...Array.from(labels).sort((a, b) => a.localeCompare(b))];
  }, [wardrobePool, allCollections]);

  const sidebarItems = useMemo(() => {
    return wardrobePool.filter((item) => {
      if (activeCategory === 'all') return true;
      return categoryLabelForItem(allCollections, item) === activeCategory;
    });
  }, [wardrobePool, allCollections, activeCategory]);

  const wardrobeIdsOnCanvas = useMemo(
    () =>
      new Set(
        pieces.filter((p): p is WardrobeCanvasPiece => p.kind === 'wardrobe').map((p) => p.itemId)
      ),
    [pieces]
  );

  const resolveWardrobeItem = useCallback(
    (id: string) => allItems.find((i) => i.id === id),
    [allItems]
  );

  const addWardrobePiece = useCallback(
    (itemId: string, x: number, y: number) => {
      if (wardrobeIdsOnCanvas.has(itemId)) return;
      const canvas = canvasRef.current;
      const maxX = canvas ? canvas.clientWidth - DEFAULT_PIECE - CANVAS_PAD : 400;
      const maxY = canvas ? canvas.clientHeight - DEFAULT_PIECE - CANVAS_PAD : 400;
      setPieces((prev) => [
        ...prev,
        {
          key: `w-${itemId}`,
          kind: 'wardrobe',
          itemId,
          x: clamp(x, CANVAS_PAD, Math.max(CANVAS_PAD, maxX)),
          y: clamp(y, CANVAS_PAD, Math.max(CANVAS_PAD, maxY)),
          w: DEFAULT_PIECE,
          h: DEFAULT_PIECE,
        },
      ]);
    },
    [wardrobeIdsOnCanvas]
  );

  const removePiece = useCallback((key: string) => {
    setPieces((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('application/x-almirobe-item');
    if (!itemId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - DEFAULT_PIECE / 2;
    const y = e.clientY - rect.top - DEFAULT_PIECE / 2;
    addWardrobePiece(itemId, x, y);
  };

  const handleSidebarDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('application/x-almirobe-item', itemId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const pointerOverDiscardBin = useCallback((clientX: number, clientY: number): boolean => {
    const bin = binRef.current;
    if (!bin) return false;
    const r = bin.getBoundingClientRect();
    const pad = 18;
    return (
      clientX >= r.left - pad &&
      clientX <= r.right + pad &&
      clientY >= r.top - pad &&
      clientY <= r.bottom + pad
    );
  }, []);

  const clearDragSession = useCallback(() => {
    dragSessionRef.current = null;
    setMoveOverlay(null);
    setBinHot(false);
  }, []);

  const bindWindowPointerSession = useCallback(() => {
    detachWindowDragRef.current?.();
    detachWindowDragRef.current = null;

    const onMove = (ev: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session || ev.pointerId !== session.pointerId) return;

      if (session.kind === 'resize') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        setPieces((prev) => {
          const piece = prev.find((p) => p.key === session.pieceKey);
          if (!piece) return prev;
          const maxW = rect.width - piece.x - CANVAS_PAD;
          const maxH = rect.height - piece.y - CANVAS_PAD;
          const w = clamp(
            session.startW + (ev.clientX - session.originX),
            MIN_PIECE,
            Math.max(MIN_PIECE, maxW)
          );
          const h = clamp(
            session.startH + (ev.clientY - session.originY),
            MIN_PIECE,
            Math.max(MIN_PIECE, maxH)
          );
          return prev.map((p) => (p.key === session.pieceKey ? { ...p, w, h } : p));
        });
        return;
      }

      const move = session;
      const distance = Math.hypot(ev.clientX - move.startX, ev.clientY - move.startY);
      if (!move.dragging && distance < DRAG_THRESHOLD_PX) return;

      if (!move.dragging) {
        move.dragging = true;
        setMoveOverlay({ key: move.pieceKey, clientX: ev.clientX, clientY: ev.clientY });
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setPieces((prev) => {
        const piece = prev.find((p) => p.key === move.pieceKey);
        if (!piece) return prev;
        const maxX = Math.max(CANVAS_PAD, rect.width - piece.w - CANVAS_PAD);
        const maxY = Math.max(CANVAS_PAD, rect.height - piece.h - CANVAS_PAD);
        const x = clamp(ev.clientX - rect.left - move.offsetX, CANVAS_PAD, maxX);
        const y = clamp(ev.clientY - rect.top - move.offsetY, CANVAS_PAD, maxY);
        return prev.map((p) => (p.key === move.pieceKey ? { ...p, x, y } : p));
      });
      setBinHot(pointerOverDiscardBin(ev.clientX, ev.clientY));
      setMoveOverlay({ key: move.pieceKey, clientX: ev.clientX, clientY: ev.clientY });
    };

    const onEnd = (ev: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session || ev.pointerId !== session.pointerId) return;

      detachWindowDragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);

      if (
        session.kind === 'move' &&
        session.dragging &&
        pointerOverDiscardBin(ev.clientX, ev.clientY)
      ) {
        removePiece(session.pieceKey);
      }

      clearDragSession();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    detachWindowDragRef.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [clearDragSession, pointerOverDiscardBin, removePiece]);

  useEffect(() => () => detachWindowDragRef.current?.(), []);

  const onCanvasPiecePointerDown = (e: React.PointerEvent, piece: CanvasPiece) => {
    if (!canvasRef.current || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.dataset.resize === '1') return;
    e.preventDefault();
    setPieces((prev) => {
      const current = prev.find((p) => p.key === piece.key);
      if (!current) return prev;
      return [...prev.filter((p) => p.key !== piece.key), current];
    });
    const rect = canvasRef.current.getBoundingClientRect();
    dragSessionRef.current = {
      kind: 'move',
      pieceKey: piece.key,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left - piece.x,
      offsetY: e.clientY - rect.top - piece.y,
      dragging: false,
    };
    bindWindowPointerSession();
  };

  const onResizePointerDown = (e: React.PointerEvent, piece: CanvasPiece) => {
    e.preventDefault();
    e.stopPropagation();
    dragSessionRef.current = {
      kind: 'resize',
      pieceKey: piece.key,
      pointerId: e.pointerId,
      startW: piece.w,
      startH: piece.h,
      originX: e.clientX,
      originY: e.clientY,
    };
    bindWindowPointerSession();
  };

  useEffect(() => {
    if (!moveOverlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moveOverlay]);

  const handleAddLink = async () => {
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      setLinkError('Paste a link to an item online.');
      return;
    }
    try {
      const parsed = new URL(trimmed);
      if (!/^https?:$/i.test(parsed.protocol)) {
        setLinkError('Use an http or https link.');
        return;
      }
    } catch {
      setLinkError('That does not look like a valid URL.');
      return;
    }
    setLinkError(null);
    setLinkBusy(true);
    try {
      const file = await apiClient.importRemoteImage(trimmed);
      const imageUrl = await extractGarmentFile(file, imageStorage);
      setPieces((prev) => [
        ...prev,
        {
          key: `ext-${Date.now()}`,
          kind: 'external',
          imageUrl,
          label: 'Online item',
          ...defaultPieceBox(prev.length),
        },
      ]);
      setLinkUrl('');
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Could not extract the garment from that link');
    } finally {
      setLinkBusy(false);
    }
  };

  const handleSave = () => {
    if (pieces.length === 0) return;
    const wardrobePieces = pieces.filter((p): p is WardrobeCanvasPiece => p.kind === 'wardrobe');

    const primaryId =
      editor.primaryItem &&
      wardrobePieces.some((p) => p.itemId === editor.primaryItem!.id)
        ? editor.primaryItem.id
        : wardrobePieces[0]?.itemId ?? `external-${Date.now()}`;

    const otherIds = wardrobePieces
      .map((p) => p.itemId)
      .filter((id) => id !== primaryId);

    const primaryItem = resolveWardrobeItem(primaryId);
    const name =
      lookName.trim() ||
      (primaryItem ? `${primaryItem.name} Look` : 'Untitled Look');
    const canvas = canvasRef.current;
    const layout = canvas
      ? layoutFromPieces(pieces, canvas.clientWidth, canvas.clientHeight)
      : editor.existingLook?.layout;

    onSave(
      buildLookFromDraft({
        primaryItemId: primaryId,
        itemIds: otherIds,
        name,
        existingLook: editor.existingLook,
        notes: lookDetails,
        layout,
      })
    );
  };

  const externalCount = pieces.filter((p) => p.kind === 'external').length;
  const wardrobeCount = pieces.filter((p) => p.kind === 'wardrobe').length;

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px) and (orientation: portrait)');
    const sync = () => setNeedsLandscape(query.matches);
    sync();
    query.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    return () => {
      query.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  useLayoutEffect(() => {
    if (layoutFitted.current) return;
    const layout = editor.existingLook?.layout;
    const canvas = canvasRef.current;
    if (!layout?.length || !canvas || canvas.clientWidth < 20) return;
    setPieces(piecesFromLayout(layout, canvas.clientWidth, canvas.clientHeight));
    layoutFitted.current = true;
  });

  return (
    <div className="relative h-full min-h-0 flex flex-col overflow-hidden">
      {needsLandscape && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink-950/92 px-8 text-center">
          <div>
            <p className="font-serif text-2xl text-ink-50">Rotate your screen</p>
            <p className="mt-2 text-sm text-ink-400">
              Create Look is laid out for landscape. Turn your phone sideways to mix outfits.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-ink-700 bg-ink-800/60 text-ink-400 hover:text-ink-100 hover:border-ink-600 flex items-center justify-center shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 text-center">
          <h2 className="text-xl sm:text-2xl font-serif text-ink-50 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-wardrobe-accent-gold shrink-0" />
            {isEditing ? 'Edit Look' : 'Create New Look'}
          </h2>
          <p className="text-[11px] text-ink-500 mt-0.5">Drag pieces from the right to mix your outfit</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={pieces.length === 0 || linkBusy}
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 disabled:opacity-40 disabled:pointer-events-none"
        >
          Save Look
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-row gap-3 overflow-hidden">
        {/* Left — mix canvas */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col rounded-2xl border border-ink-700/60 bg-gradient-to-b from-ink-900/80 to-ink-800/50 overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-ink-700/40 shrink-0">
            <input
              value={lookName}
              onChange={(e) => setLookName(e.target.value)}
              placeholder="Look name"
              className="w-full text-center bg-transparent text-lg sm:text-xl font-serif text-ink-50 placeholder-ink-600 focus:outline-none"
            />
          </div>

          <div
            ref={canvasRef}
            className="relative flex-1 min-h-0 mx-3 mt-3 rounded-xl border border-dashed border-ink-600/50 bg-ink-950/40 overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
          >
            {pieces.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-600 pointer-events-none px-6 text-center">
                <div className="w-24 h-24 rounded-xl border-2 border-ink-700/50 flex items-center justify-center mb-3">
                  <Shirt className="w-12 h-12 text-ink-700" strokeWidth={1.25} />
                </div>
                <p className="text-sm text-ink-500">Drop items here to build your look</p>
              </div>
            )}

            {pieces.map((piece) => {
              const isDragging = moveOverlay?.key === piece.key;
              return (
                <div
                  key={piece.key}
                  className={`absolute touch-none cursor-grab active:cursor-grabbing rounded-xl overflow-hidden border-2 bg-ink-900/80 shadow-lg garment-cutout ${
                    isDragging
                      ? 'border-wardrobe-accent-gold z-20 opacity-0 pointer-events-none'
                      : 'border-ink-600/80 z-10'
                  }`}
                  style={{
                    left: piece.x,
                    top: piece.y,
                    width: piece.w,
                    height: piece.h,
                  }}
                  onPointerDown={(e) => onCanvasPiecePointerDown(e, piece)}
                >
                  {piece.kind === 'wardrobe' ? (
                    (() => {
                      const item = resolveWardrobeItem(piece.itemId);
                      if (!item) return null;
                      return (
                        <ItemImage
                          item={item}
                          alt={item.name}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      );
                    })()
                  ) : (
                    <img
                      src={piece.imageUrl}
                      alt={piece.label}
                      className="w-full h-full object-cover pointer-events-none bg-ink-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <button
                    type="button"
                    data-resize="1"
                    aria-label="Resize piece"
                    className="absolute bottom-0.5 right-0.5 z-20 h-4 w-4 rounded-sm border border-ink-200/70 bg-ink-950/80 cursor-nwse-resize"
                    onPointerDown={(e) => onResizePointerDown(e, piece)}
                  />
                </div>
              );
            })}

          </div>

          <div className="px-3 py-2 shrink-0 border-t border-ink-700/40 mt-2">
            <p className="text-[11px] font-medium text-ink-400 mb-1">Look details</p>
            <textarea
              value={lookDetails}
              onChange={(e) => setLookDetails(e.target.value)}
              placeholder="Casual office wear for pre-winter season. Can also be used for interviews."
              rows={2}
              className="w-full resize-none rounded-lg bg-ink-950/50 border border-ink-700/50 px-3 py-1.5 text-sm text-ink-200 placeholder-ink-600 focus:outline-none focus:border-wardrobe-accent-gold/40"
            />
            {externalCount > 0 && (
              <p className="text-[10px] text-ink-500 mt-1">
                {externalCount} linked piece{externalCount === 1 ? '' : 's'} included in this look
              </p>
            )}
          </div>
        </div>

        {/* Right — wardrobe picker */}
        <div className="w-[min(38%,420px)] min-w-[200px] min-h-0 flex flex-col rounded-2xl border border-ink-700/60 bg-ink-800/40 overflow-hidden shrink-0">
          <div className="px-2 pt-2 pb-2 border-b border-ink-700/40 shrink-0">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {categoryTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveCategory(tab)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                    activeCategory === tab
                      ? 'bg-wardrobe-accent-gold/20 text-wardrobe-accent-gold border-wardrobe-accent-gold/40'
                      : 'bg-ink-900/50 text-ink-400 border-ink-700/40 hover:text-ink-300'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 py-2">
            <div className="grid grid-cols-2 gap-2 content-start">
            {sidebarItems.length === 0 ? (
              <p className="col-span-2 text-center text-ink-500 text-sm py-8">No items in this category</p>
            ) : (
              sidebarItems.map((item) => {
                const onCanvas = wardrobeIdsOnCanvas.has(item.id);
                return (
                  <div
                    key={item.id}
                    draggable={!onCanvas}
                    onDragStart={(e) => handleSidebarDragStart(e, item.id)}
                    onClick={() => {
                      if (onCanvas) return;
                      const pos = defaultPieceBox(pieces.length);
                      addWardrobePiece(item.id, pos.x, pos.y);
                    }}
                    role="button"
                    tabIndex={onCanvas ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!onCanvas) {
                          const pos = defaultPieceBox(pieces.length);
                          addWardrobePiece(item.id, pos.x, pos.y);
                        }
                      }
                    }}
                    className={`flex flex-col rounded-xl border overflow-hidden transition-all ${
                      onCanvas
                        ? 'border-wardrobe-accent-gold/30 bg-ink-900/30 opacity-60 cursor-default'
                        : 'border-ink-700/50 bg-ink-900/50 hover:border-ink-600 cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden border-b border-ink-700">
                      <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 px-1.5 py-1">
                      <p className="text-[10px] text-ink-100 truncate">{item.name}</p>
                      <p className="text-[9px] text-ink-500 truncate">
                        {categoryLabelForItem(allCollections, item)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          <div className="p-2.5 border-t border-ink-700/40 bg-ink-900/30 shrink-0">
            <p className="text-[10px] text-ink-500 mb-2 flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              Add a link to an item online. The garment is extracted the same way as a photo upload.
            </p>
            <div className="flex gap-2">
              <input
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setLinkError(null);
                }}
                placeholder="https://…"
                className="flex-1 min-w-0 rounded-lg bg-ink-950/60 border border-ink-700/50 px-2 py-1.5 text-xs text-ink-200 placeholder-ink-600 focus:outline-none focus:border-wardrobe-accent-gold/40"
              />
              <button
                type="button"
                onClick={() => void handleAddLink()}
                disabled={linkBusy}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-900 bg-wardrobe-accent-gold/90 hover:bg-wardrobe-accent-gold disabled:opacity-50"
              >
                {linkBusy ? 'Extracting…' : 'Add'}
              </button>
            </div>
            {linkError && <p className="text-[10px] text-red-300 mt-1">{linkError}</p>}
          </div>
        </div>
      </div>

      {moveOverlay &&
        createPortal(
          <LookDiscardOverlay
            binRef={binRef}
            hot={binHot}
            x={moveOverlay.clientX}
            y={moveOverlay.clientY}
            piece={pieces.find((piece) => piece.key === moveOverlay.key)}
            resolveItem={resolveWardrobeItem}
          />,
          document.body
        )}
    </div>
  );
}

function LookDiscardOverlay({
  binRef,
  hot,
  x,
  y,
  piece,
  resolveItem,
}: {
  binRef: React.Ref<HTMLDivElement>;
  hot: boolean;
  x: number;
  y: number;
  piece?: CanvasPiece;
  resolveItem: (id: string) => WardrobeItem | undefined;
}) {
  const item = piece?.kind === 'wardrobe' ? resolveItem(piece.itemId) : undefined;
  return (
    <div className="fixed inset-0 z-[250] pointer-events-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in" />
      {piece && (
        <div
          className="absolute w-20 h-24 -translate-x-1/2 -translate-y-1/2 rounded-lg overflow-hidden border-2 border-wardrobe-accent-gold shadow-2xl shadow-wardrobe-accent-gold/40 rotate-3"
          style={{ left: x, top: y }}
        >
          {item ? (
            <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
          ) : piece.kind === 'external' ? (
            <img src={piece.imageUrl} alt={piece.label} className="w-full h-full object-cover" />
          ) : null}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-10 bg-gradient-to-t from-ink-900 via-ink-900/95 to-transparent">
        <p className="text-center text-xs text-ink-400 mb-4 tracking-wide">Drop on a bin to sort this piece</p>
        <div className="flex justify-center gap-4 sm:gap-8 max-w-lg mx-auto">
          <div className={`flex flex-col items-center gap-2 transition-all duration-200 ${hot ? 'scale-105' : ''}`}>
            <div
              ref={binRef}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${
                hot
                  ? 'border-red-400 bg-red-500/30 text-red-100 scale-110 shadow-lg shadow-red-500/30'
                  : 'border-red-800/50 bg-red-950/60 text-red-300'
              }`}
            >
              <Trash2 className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.5} />
            </div>
            <span className={`text-xs font-medium transition-colors ${hot ? 'text-ink-100' : 'text-ink-400'}`}>
              Discard
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
