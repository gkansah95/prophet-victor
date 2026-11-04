import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { uploadSignedCloudinaryImage } from '../../lib/api';
import { getOptimizedImageUrl } from '../../lib/media';
import type { CloudImage } from '../../types/cms';

interface CloudinaryImageInputProps {
  label: string;
  folder: string;
  value?: CloudImage;
  onChange: (next: CloudImage) => void;
  aspectClass?: string;
  helperText?: string;
}

export function CloudinaryImageInput({
  label,
  folder,
  value,
  onChange,
  aspectClass = 'aspect-video',
  helperText = 'JPG, PNG, WebP or AVIF · Max 10 MB · Stored securely on Cloudinary',
}: CloudinaryImageInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const hasImage = Boolean(value?.url);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(5);
    setError(null);

    try {
      const uploaded = await uploadSignedCloudinaryImage(
        file,
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
      if (inputRef.current) {
        inputRef.current.value = '';
      }
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

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F296B] hover:bg-[#163A94] dark:bg-[#C6922C] dark:hover:bg-[#B38222] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{uploading ? `Uploading ${progress}%` : 'Replace Image'}</span>
                </button>

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
              <span>Select Photograph</span>
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
    </div>
  );
}
