import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { resizeImage } from '@/imageUtils';

interface PhotoUploadProps {
  imageData?: string;
  onChange: (data: string | undefined) => void;
  label?: string;
}

export default function PhotoUpload({ imageData, onChange, label = 'Photo' }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState('');

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
    try {
      setImageError('');
      const resized = await resizeImage(file, 400);
      onChange(resized);
    } catch {
      setImageError('Could not process the image');
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div>
      <label className="block text-xs font-medium text-ink-300 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-3">
        {/* Preview */}
        <div
          className="relative w-24 h-24 rounded-lg border border-ink-700 overflow-hidden flex items-center justify-center bg-ink-900/60 cursor-pointer group flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          {imageData ? (
            <>
              <img src={imageData} alt="Preview" className="w-full h-full object-cover" />
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

        {/* Action buttons */}
        <div className="flex-1 space-y-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-ink-200 bg-ink-900/60 border border-ink-700 hover:border-ink-600 transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-ink-200 bg-ink-900/60 border border-ink-700 hover:border-ink-600 transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              Camera
            </button>
          </div>
          {imageData && (
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
          <p className="text-[10px] text-ink-600">JPG or PNG, up to 10MB</p>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
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
