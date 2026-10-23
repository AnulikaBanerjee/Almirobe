import { useCallback, useEffect, useRef, useState } from 'react';
import { Crop, Loader2, RotateCcw, RotateCw, Sparkles, X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import { blobToCanvas } from '@/imageProcessing/canvasUtils';
import { knockOutStudioBackground } from '@/imageProcessing/studioBackground';
import { exportGarmentSelection, transformSource, type CropNorm } from '@/imageProcessing/transform';

interface GarmentCropModalProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

type Handle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MIN = 0.08;
const DEFAULT_CROP: CropNorm = { x: 0.06, y: 0.06, w: 0.88, h: 0.88 };

function clampCrop(crop: CropNorm): CropNorm {
  const w = Math.max(MIN, Math.min(crop.w, 1));
  const h = Math.max(MIN, Math.min(crop.h, 1));
  const x = Math.max(0, Math.min(crop.x, 1 - w));
  const y = Math.max(0, Math.min(crop.y, 1 - h));
  return { x, y, w, h };
}

export default function GarmentCropModal({ imageUrl, onClose, onSave }: GarmentCropModalProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ handle: Handle; startX: number; startY: number; crop: CropNorm } | null>(null);
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadError, setLoadError] = useState('');
  const [crop, setCrop] = useState<CropNorm>(DEFAULT_CROP);
  const [turns, setTurns] = useState(0);
  const [fineRotate, setFineRotate] = useState(0);
  const [skewX, setSkewX] = useState(0);
  const [skewY, setSkewY] = useState(0);
  const rotation = turns * 90 + fineRotate;
  const [saving, setSaving] = useState(false);
  const [fitted, setFitted] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const cropRef = useRef(crop);
  const fittedRef = useRef(fitted);
  cropRef.current = crop;
  fittedRef.current = fitted;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const canvas = await blobToCanvas(blob);
        const garment = knockOutStudioBackground(canvas);
        if (!cancelled) setSource(garment);
      } catch {
        if (!cancelled) setLoadError('Could not load the extracted photo');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!source) return;
    const transformed = transformSource(source, rotation, skewX, skewY);
    setPreviewUrl(transformed.toDataURL('image/png'));
  }, [source, rotation, skewX, skewY]);

  const measureFit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !previewUrl) return;
    const img = stage.querySelector('img');
    if (!(img instanceof HTMLImageElement) || !img.naturalWidth) return;
    const box = stage.getBoundingClientRect();
    const scale = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight);
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;
    setFitted({
      left: (box.width - width) / 2,
      top: (box.height - height) / 2,
      width,
      height,
    });
  }, [previewUrl]);

  useEffect(() => {
    measureFit();
    window.addEventListener('resize', measureFit);
    return () => window.removeEventListener('resize', measureFit);
  }, [measureFit]);

  useEffect(() => {
    const applyDrag = (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      const stage = stageRef.current;
      const fit = fittedRef.current;
      if (!drag || !stage || fit.width < 1) return;
      const box = stage.getBoundingClientRect();
      const toCrop = (x: number, y: number) => ({
        x: (x - box.left - fit.left) / fit.width,
        y: (y - box.top - fit.top) / fit.height,
      });
      const pos = toCrop(clientX, clientY);
      const start = toCrop(drag.startX, drag.startY);
      const dx = pos.x - start.x;
      const dy = pos.y - start.y;
      const c = drag.crop;
      let next = { ...c };
      if (drag.handle === 'move') {
        next = { ...c, x: c.x + dx, y: c.y + dy };
      } else {
        let x = c.x;
        let y = c.y;
        let w = c.w;
        let h = c.h;
        if (drag.handle.includes('w')) {
          x = c.x + dx;
          w = c.w - dx;
        }
        if (drag.handle.includes('e')) w = c.w + dx;
        if (drag.handle.includes('n')) {
          y = c.y + dy;
          h = c.h - dy;
        }
        if (drag.handle.includes('s')) h = c.h + dy;
        next = { x, y, w, h };
      }
      setCrop(clampCrop(next));
    };
    const onMove = (event: PointerEvent) => applyDrag(event.clientX, event.clientY);
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const onPointerDown = (handle: Handle) => (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { handle, startX: event.clientX, startY: event.clientY, crop: cropRef.current };
  };

  const handleSave = async () => {
    if (!source || saving) return;
    setSaving(true);
    try {
      const dataUrl = await exportGarmentSelection(source, crop, rotation, skewX, skewY);
      onSave(dataUrl);
    } finally {
      setSaving(false);
    }
  };

  const handleSize = 14;

  return (
    <ModalPortal onBackdropClick={saving ? undefined : onClose} zIndex={540} backdropClassName="bg-black/80 backdrop-blur-md">
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[min(94vh,860px)] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-ink-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-wardrobe-accent-gold" />
            <div>
              <h3 className="text-lg font-serif text-ink-50">Choose the item</h3>
              <p className="text-[10px] text-ink-500">Crop the garment you want · rotate or straighten if needed</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div
            ref={stageRef}
            className="relative aspect-[3/4] rounded-xl overflow-hidden border border-ink-700"
            style={{
              backgroundColor: '#1c1917',
              backgroundImage:
                'linear-gradient(45deg, #292524 25%, transparent 25%), linear-gradient(-45deg, #292524 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #292524 75%), linear-gradient(-45deg, transparent 75%, #292524 75%)',
              backgroundSize: '18px 18px',
              backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0',
            }}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) onPointerDown('move')(event);
            }}
          >
            {!previewUrl && !loadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-400">
                <Loader2 className="w-7 h-7 text-wardrobe-accent-gold animate-spin" />
                <p className="text-xs">Loading cutout…</p>
              </div>
            )}
            {loadError && <p className="absolute inset-0 flex items-center justify-center text-sm text-red-400 p-4 text-center">{loadError}</p>}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Extracted garments"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                onLoad={measureFit}
              />
            )}
            {previewUrl && fitted.width > 0 && (
              <div
                className="absolute"
                style={{ left: fitted.left, top: fitted.top, width: fitted.width, height: fitted.height }}
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className="absolute bg-black/55"
                    style={{ left: 0, top: 0, right: 0, height: `${crop.y * 100}%` }}
                  />
                  <div
                    className="absolute bg-black/55"
                    style={{ left: 0, top: `${(crop.y + crop.h) * 100}%`, right: 0, bottom: 0 }}
                  />
                  <div
                    className="absolute bg-black/55"
                    style={{
                      left: 0,
                      top: `${crop.y * 100}%`,
                      width: `${crop.x * 100}%`,
                      height: `${crop.h * 100}%`,
                    }}
                  />
                  <div
                    className="absolute bg-black/55"
                    style={{
                      left: `${(crop.x + crop.w) * 100}%`,
                      top: `${crop.y * 100}%`,
                      right: 0,
                      height: `${crop.h * 100}%`,
                    }}
                  />
                </div>
                <div
                  className="absolute border-2 border-wardrobe-accent-gold cursor-move"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.w * 100}%`,
                    height: `${crop.h * 100}%`,
                    boxShadow: '0 0 0 1px rgba(201,169,110,0.35)',
                  }}
                  onPointerDown={onPointerDown('move')}
                >
                  <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-wardrobe-accent-gold/70" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-wardrobe-accent-gold/70" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-wardrobe-accent-gold/70" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-wardrobe-accent-gold/70" />
                  </div>
                  {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as Handle[]).map((handle) => (
                    <span
                      key={handle}
                      onPointerDown={onPointerDown(handle)}
                      className="absolute bg-wardrobe-accent-gold rounded-sm shadow"
                      style={{
                        width: handleSize,
                        height: handleSize,
                        ...handleStyle(handle, handleSize),
                        cursor: cursorFor(handle),
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-900/50 p-3 space-y-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-400">
              <Crop className="w-3.5 h-3.5 text-wardrobe-accent-gold" />
              Drag the frame to crop
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTurns((value) => value - 1)}
                className="p-2 rounded-lg border border-ink-700 text-ink-300 hover:border-wardrobe-accent-gold/50"
                aria-label="Rotate left"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTurns((value) => value + 1)}
                className="p-2 rounded-lg border border-ink-700 text-ink-300 hover:border-wardrobe-accent-gold/50"
                aria-label="Rotate right"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <label className="flex-1 text-[10px] uppercase tracking-wider text-ink-400">
                Fine rotate
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={fineRotate}
                  onChange={(e) => setFineRotate(Number(e.target.value))}
                  className="w-full accent-amber-400 mt-1"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[10px] uppercase tracking-wider text-ink-400">
                Skew horizontal
                <input
                  type="range"
                  min={-18}
                  max={18}
                  step={1}
                  value={skewX}
                  onChange={(e) => setSkewX(Number(e.target.value))}
                  className="w-full accent-amber-400 mt-1"
                />
              </label>
              <label className="text-[10px] uppercase tracking-wider text-ink-400">
                Skew vertical
                <input
                  type="range"
                  min={-18}
                  max={18}
                  step={1}
                  value={skewY}
                  onChange={(e) => setSkewY(Number(e.target.value))}
                  className="w-full accent-amber-400 mt-1"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                setTurns(0);
                setFineRotate(0);
                setSkewX(0);
                setSkewY(0);
                setCrop(DEFAULT_CROP);
              }}
              className="text-[11px] text-ink-500 hover:text-ink-300"
            >
              Reset adjustments
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-ink-700 flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm text-ink-300 border border-ink-700 hover:bg-ink-700/50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!source || saving}
            onClick={() => void handleSave()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 disabled:opacity-40 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}

function cursorFor(handle: Handle): string {
  if (handle === 'n' || handle === 's') return 'ns-resize';
  if (handle === 'e' || handle === 'w') return 'ew-resize';
  if (handle === 'ne' || handle === 'sw') return 'nesw-resize';
  if (handle === 'nw' || handle === 'se') return 'nwse-resize';
  return 'move';
}

function handleStyle(handle: Handle, size: number): React.CSSProperties {
  const half = size / 2;
  const map: Record<string, React.CSSProperties> = {
    nw: { left: -half, top: -half },
    n: { left: `calc(50% - ${half}px)`, top: -half },
    ne: { right: -half, top: -half },
    e: { right: -half, top: `calc(50% - ${half}px)` },
    se: { right: -half, bottom: -half },
    s: { left: `calc(50% - ${half}px)`, bottom: -half },
    sw: { left: -half, bottom: -half },
    w: { left: -half, top: `calc(50% - ${half}px)` },
  };
  return map[handle] ?? {};
}
