import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Loader2, Sparkles, X } from 'lucide-react';
import { resizeImage } from '@/imageUtils';
import { useImageStorage } from '@/images';
import ImageProcessingPreviewModal from '@/components/ImageProcessingPreviewModal';

interface PhotoUploadProps {
  imageUrl?: string;
  imageData?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
  /** Run background removal and enhance on upload (wardrobe items) */
  enableSmartProcessing?: boolean;
}

export default function PhotoUpload({
  imageUrl,
  imageData,
  onChange,
  label = 'Photo',
  enableSmartProcessing = true,
}: PhotoUploadProps) {
  const imageStorage = useImageStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const preview = imageUrl ?? imageData;

  const uploadDataUrl = async (dataUrl: string) => {
    setUploading(true);
    try {
      const toStore = dataUrl.startsWith('data:image/png')
        ? dataUrl
        : await resizeImage(dataUrl, 1024);
      const stored = await imageStorage.upload(toStore);
      onChange(stored.url);
    } catch {
      setImageError('Could not save the image');
    } finally {
      setUploading(false);
    }
  };

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

    if (enableSmartProcessing) {
      setPendingFile(file);
    } else {
      try {
        setUploading(true);
        const resized = await resizeImage(file, 1024);
        const stored = await imageStorage.upload(resized);
        onChange(stored.url);
      } catch {
        setImageError('Could not save the image');
      } finally {
        setUploading(false);
      }
    }
    e.target.value = '';
  };

  const handleProcessingConfirm = async (dataUrl: string) => {
    setPendingFile(null);
    if (!dataUrl) return;
    await uploadDataUrl(dataUrl);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-ink-300 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-3">
        <div
          className="relative w-24 h-24 rounded-lg border border-ink-700 overflow-hidden flex items-center justify-center bg-ink-900/60 cursor-pointer group flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (!uploading && !pendingFile) fileInputRef.current?.click();
          }}
        >
          {uploading || pendingFile ? (
            <Loader2 className="w-6 h-6 text-wardrobe-accent-gold animate-spin" />
          ) : preview ? (
            <>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
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
              disabled={uploading || Boolean(pendingFile)}
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
              disabled={uploading || Boolean(pendingFile)}
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
          {imageError && <p className="text-xs text-red-400">{imageError}</p>}
          <p className="text-[10px] text-ink-600 flex items-center gap-1">
            {enableSmartProcessing && <Sparkles className="w-3 h-3 text-wardrobe-accent-gold/70" />}
            JPG or PNG, up to 10MB
            {enableSmartProcessing ? ' · auto background removal' : ''}
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

      {pendingFile && (
        <ImageProcessingPreviewModal
          file={pendingFile}
          onClose={() => setPendingFile(null)}
          onConfirm={handleProcessingConfirm}
        />
      )}
    </div>
  );
}
