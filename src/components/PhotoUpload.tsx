import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Loader2, Sparkles, X } from 'lucide-react';
import { blobToDataUrl } from '@/imageProcessing/canvasUtils';
import { useImageStorage } from '@/images';

interface PhotoUploadProps {
  imageUrl?: string;
  imageData?: string;
  onChange: (url: string | undefined) => void;
  onFileSelected?: (file: File) => void;
  onAdjust?: () => void;
  needsCrop?: boolean;
  label?: string;
  cutoutPending?: boolean;
  /** @deprecated processing is always automatic and non-blocking */
  enableSmartProcessing?: boolean;
}

export default function PhotoUpload({
  imageUrl,
  imageData,
  onChange,
  onFileSelected,
  onAdjust,
  needsCrop = false,
  label = 'Photo',
  cutoutPending = false,
}: PhotoUploadProps) {
  const imageStorage = useImageStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState('');
  const [reading, setReading] = useState(false);

  const preview = imageUrl ?? imageData;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image must be under 10MB');
      return;
    }
    setImageError('');
    setReading(true);
    try {
      if (onFileSelected) {
        onFileSelected(file);
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      onChange(previewUrl);
      const dataUrl = await blobToDataUrl(file);
      const stored = await imageStorage.upload(dataUrl);
      onChange(stored.url);
    } catch {
      setImageError('Could not save the image');
    } finally {
      setReading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-ink-300 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-3">
        <div
          className="relative w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center bg-ink-900/60 cursor-pointer group flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (!reading) fileInputRef.current?.click();
          }}
        >
          {reading ? (
            <Loader2 className="w-6 h-6 text-wardrobe-accent-gold animate-spin" />
          ) : preview ? (
            <>
              <img src={preview} alt="Preview" className="w-full h-full object-contain drop-shadow-md" />
              {cutoutPending && (
                <div className="absolute inset-x-0 bottom-0 bg-black/55 text-[9px] text-amber-100 py-0.5 text-center">
                  Cutout…
                </div>
              )}
              {needsCrop && !cutoutPending && (
                <div className="absolute inset-x-0 bottom-0 bg-black/55 text-[9px] text-amber-100 py-0.5 text-center">
                  Crop item
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-ink-500 group-hover:text-ink-300 transition-colors">
              <ImageIcon className="w-6 h-6" />
              <span className="text-[10px]">No photo</span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={reading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-ink-200 bg-ink-900/60 border border-ink-700 hover:border-ink-600 transition-all disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Upload
            </button>
            <button
              type="button"
              disabled={reading}
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-ink-200 bg-ink-900/60 border border-ink-700 hover:border-ink-600 transition-all disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              Camera
            </button>
          </div>
          {preview && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
              Remove photo
            </button>
          )}
          {preview && onAdjust && !cutoutPending && (
            <button
              type="button"
              onClick={onAdjust}
              className="flex items-center gap-1.5 text-xs text-wardrobe-accent-gold hover:text-amber-200 transition-colors"
            >
              {needsCrop ? 'Crop the item you want' : 'Crop / rotate / straighten'}
            </button>
          )}
          {imageError && <p className="text-xs text-red-400">{imageError}</p>}
          <p className="text-[10px] text-ink-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-wardrobe-accent-gold/70" />
            JPG or PNG, up to 10MB · auto tags + cutout
          </p>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
