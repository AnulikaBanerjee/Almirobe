import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import {
  bitmapToCanvas,
  loadBitmapFromFile,
} from '@/imageProcessing/canvasUtils';
import {
  runClothingImagePipeline,
  type PipelineStage,
} from '@/imageProcessing/pipeline';

interface ImageProcessingPreviewModalProps {
  file: File;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
}

type Phase = 'processing' | 'review' | 'error';

const STAGE_LABELS: Record<PipelineStage, string> = {
  loading: 'Loading photo…',
  enhance: 'Improving brightness…',
  background: 'Removing background…',
  composite: 'Finishing…',
  done: 'Ready',
  error: 'Something went wrong',
};

export default function ImageProcessingPreviewModal({
  file,
  onClose,
  onConfirm,
}: ImageProcessingPreviewModalProps) {
  const [phase, setPhase] = useState<Phase>('processing');
  const [stage, setStage] = useState<PipelineStage>('loading');
  const [stageMessage, setStageMessage] = useState('');
  const [progressRatio, setProgressRatio] = useState<number | undefined>();
  const [error, setError] = useState('');
  const [originalDataUrl, setOriginalDataUrl] = useState('');
  const [processedDataUrl, setProcessedDataUrl] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bitmap = await loadBitmapFromFile(file);
        const canvas = bitmapToCanvas(bitmap);
        if (cancelled) return;
        setOriginalDataUrl(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        /* pipeline will surface the error */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const runPipeline = useCallback(async () => {
    setPhase('processing');
    setError('');
    try {
      const result = await runClothingImagePipeline(file, {
        onProgress: (s, message, ratio) => {
          setStage(s);
          setStageMessage(message || STAGE_LABELS[s]);
          setProgressRatio(ratio);
        },
      });
      setOriginalDataUrl(result.originalDataUrl);
      setProcessedDataUrl(result.processedDataUrl);
      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process image');
      setPhase('error');
    }
  }, [file]);

  useEffect(() => {
    void runPipeline();
  }, [runPipeline]);

  const previewSrc = showOriginal ? originalDataUrl : processedDataUrl;

  return (
    <ModalPortal
      onBackdropClick={phase === 'processing' ? undefined : onClose}
      zIndex={520}
      backdropClassName="bg-black/80 backdrop-blur-md"
    >
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[min(92vh,820px)] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-ink-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-wardrobe-accent-gold" />
            <div>
              <h3 className="text-lg font-serif text-ink-50">Remove background</h3>
              <p className="text-[10px] text-ink-500">Automatic cutout</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-ink-900 border border-ink-700">
            {phase === 'processing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                <Loader2 className="w-8 h-8 text-wardrobe-accent-gold animate-spin" />
                <p className="text-sm text-ink-200">{stageMessage || STAGE_LABELS[stage]}</p>
                {progressRatio != null && progressRatio > 0 && (
                  <div className="w-full max-w-xs h-1.5 rounded-full bg-ink-700 overflow-hidden">
                    <div
                      className="h-full bg-wardrobe-accent-gold transition-all duration-300"
                      style={{ width: `${Math.round(progressRatio * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            {phase === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-2">
                {originalDataUrl && (
                  <img src={originalDataUrl} alt="Original" className="max-h-48 object-contain rounded-lg opacity-70" />
                )}
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            {phase === 'review' && previewSrc && (
              <img src={previewSrc} alt="Preview" className="w-full h-full object-contain" />
            )}
          </div>

          {phase === 'review' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowOriginal(false)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                  !showOriginal
                    ? 'border-wardrobe-accent-gold/50 bg-wardrobe-accent-gold/15 text-wardrobe-accent-gold'
                    : 'border-ink-700 text-ink-400'
                }`}
              >
                Cutout
              </button>
              <button
                type="button"
                onClick={() => setShowOriginal(true)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                  showOriginal
                    ? 'border-wardrobe-accent-gold/50 bg-wardrobe-accent-gold/15 text-wardrobe-accent-gold'
                    : 'border-ink-700 text-ink-400'
                }`}
              >
                Original
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-ink-700 flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm text-ink-300 border border-ink-700 hover:bg-ink-700/50"
          >
            Cancel
          </button>
          {phase === 'error' ? (
            <button
              type="button"
              disabled={!originalDataUrl}
              onClick={() => originalDataUrl && onConfirm(originalDataUrl)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 disabled:opacity-40"
            >
              Use original
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={!originalDataUrl}
                onClick={() => onConfirm(originalDataUrl)}
                className="flex-1 py-2.5 rounded-lg text-sm text-ink-300 border border-ink-700 hover:bg-ink-700/50 disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!processedDataUrl || phase !== 'review'}
                onClick={() => onConfirm(processedDataUrl)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 disabled:opacity-40"
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
