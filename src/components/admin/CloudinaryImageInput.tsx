import React, { useRef, useState } from 'react';
import { Crop, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { uploadSignedCloudinaryImage } from '../../lib/api';
import { getOptimizedImageUrl } from '../../lib/media';
import type { CloudImage } from '../../types/cms';
import { ImageCropperModal } from './ImageCropperModal';

interface CloudinaryImageInputProps {
  label: string;
  folder: string;
  value?: CloudImage;
  onChange: (next: CloudImage) => void;
  aspectClass?: string;
  helperText?: string;
}

function parseInitialAspect(aspectClass: string): number | null {
  if (aspectClass.includes('aspect-video') || aspectClass.includes('16/9') || aspectClass.includes('16-9')) {
    return 16 / 9;
  }
  if (aspectClass.includes('aspect-square') || aspectClass.includes('1/1') || aspectClass.includes('1-1')) {
    return 1;
  }
  if (aspectClass.includes('3/4') || aspectClass.includes('3-4')) {
    return 3 / 4;
  }
  if (aspectClass.includes('4/3') || aspectClass.includes('4-3')) {
    return 4 / 3;
  }
  if (aspectClass.includes('21/9') || aspectClass.includes('21-9')) {
    return 21 / 9;
  }
  return 16 / 9;
}

export function CloudinaryImageInput({
  label,
  folder,
  value,
  onChange,
  aspectClass = 'aspect-video',
  helperText = 'JPG, PNG, WebP or AVIF · Crop & position tool included · Stored securely on Cloudinary',
}: CloudinaryImageInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Cropper modal state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [cropperFileName, setCropperFileName] = useState('photograph.jpg');

  const hasImage = Boolean(value?.url);
  const initialAspect = parseInitialAspect(aspectClass);

  // Handle file selection from local device -> Open Cropper Modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setCropperSrc(objectUrl);
    setCropperFileName(file.name);
    setCropperOpen(true);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Open cropper for existing uploaded image
  const handleOpenCropperForExisting = () => {
    if (!value?.url) return;
    setError(null);
    setCropperSrc(value.url);
    setCropperFileName('existing-photo.jpg');
    setCropperOpen(true);
  };

  // When crop is confirmed -> upload the cropped file to Cloudinary
  const handleCropConfirm = async (croppedFile: File) => {
    setCropperOpen(false);
    setUploading(true);
    setProgress(5);
    setError(null);

    try {
      const uploaded = await uploadSignedCloudinaryImage(
        croppedFile,
        folder,
        value?.alt || '',
        (pct) => setProgress(pct)
      );
      onChange({
        ...uploaded,
        alt: value?.alt || uploaded.alt || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </label>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</span>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#060E24]">
        {hasImage ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-5">
              <div
                className={`relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900 ${aspectClass}`}
              >
                <img
                  src={getOptimizedImageUrl(value?.url, { width: 640, crop: 'limit' })}
                  alt={value?.alt || label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="sm:col-span-7 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Image Description (Alt Text)
                </label>
                <input
                  type="text"
                  value={value?.alt || ''}
                  onChange={(e) =>
                    onChange({
                      url: value?.url || '',
                      publicId: value?.publicId || '',
                      width: value?.width || 0,
                      height: value?.height || 0,
                      alt: e.target.value,
                    })
                  }
                  placeholder="Describe this photograph for accessibility & SEO"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0A193C] text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Crop & Frame Existing Image Button */}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleOpenCropperForExisting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Crop className="w-3.5 h-3.5 text-[#C6922C]" />
                  <span>Crop / Fit Frame</span>
                </button>

                {/* Replace Image Button */}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{uploading ? `Uploading ${progress}%` : 'Replace Image'}</span>
                </button>

                {/* Remove Image Button */}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => onChange({ url: '', publicId: '', alt: '', width: 0, height: 0 })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-11 h-11 rounded-full bg-[#0F296B]/10 dark:bg-white/10 text-[#0F296B] dark:text-[#DDB04F] flex items-center justify-center mb-2.5">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImagePlus className="w-5 h-5" />
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              {uploading ? `Uploading to Cloudinary (${progress}%)...` : 'No photograph uploaded yet'}
            </p>
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select Photograph & Crop</span>
            </button>
          </div>
        )}

        {uploading && (
          <div className="mt-3 w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C6922C] transition-all duration-200"
              style={{ width: `${Math.max(8, progress)}%` }}
            />
          </div>
        )}

        {error && (
          <p className="mt-2.5 text-xs text-red-600 dark:text-red-300 font-medium">{error}</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Interactive Crop & Framing Modal */}
      {cropperOpen && cropperSrc && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          fileName={cropperFileName}
          initialAspect={initialAspect}
          onConfirm={handleCropConfirm}
          onCancel={() => {
            setCropperOpen(false);
            setCropperSrc(null);
          }}
        />
      )}
    </div>
  );
}
