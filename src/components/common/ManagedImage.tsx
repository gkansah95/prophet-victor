import { useState } from 'react';
import { getOptimizedImageUrl, getResponsiveSrcSet } from '../../lib/media';

interface ManagedImageProps {
  url?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
}

/**
 * Dynamically renders Cloudinary-managed images from MongoDB with responsive srcSet,
 * lazy loading, and a regal royal-blue & gold monogram crest fallback when no image is set
 * or if network delivery fails (Zero-Broken-Image Policy without hardcoded mock photos).
 */
export function ManagedImage({
  url,
  alt,
  className = '',
  imgClassName = 'w-full h-full object-cover',
  width = 1200,
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw',
  priority = false,
  fallbackTitle = 'Global Seekers Chapel',
  fallbackSubtitle = 'Seeking God',
}: ManagedImageProps) {
  const [failed, setFailed] = useState(false);

  const hasValidImage = Boolean(url && url.trim() && !failed);

  if (!hasValidImage) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#0A193C] via-[#0F296B] to-[#07122B] flex flex-col items-center justify-center text-center p-6 select-none ${className}`}
        role="img"
        aria-label={alt || fallbackTitle}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 25%, rgba(221, 176, 79, 0.38), transparent 65%)',
          }}
        />
        <div className="relative z-10 w-16 h-16 rounded-full border border-[#C6922C]/50 bg-[#0A193C]/70 flex items-center justify-center mb-3">
          <svg
            viewBox="0 0 48 48"
            className="w-8 h-8 text-[#DDB04F]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden="true"
          >
            <path d="M24 6v36M14 16h20" strokeLinecap="round" />
            <circle cx="24" cy="24" r="19" strokeOpacity="0.45" />
          </svg>
        </div>
        <span className="relative z-10 font-serif text-lg font-semibold text-white tracking-wide">
          {fallbackTitle}
        </span>
        {fallbackSubtitle && (
          <span className="relative z-10 text-xs text-[#EDD089]/90 mt-1 tracking-widest uppercase">
            {fallbackSubtitle}
          </span>
        )}
      </div>
    );
  }

  const optimizedSrc = getOptimizedImageUrl(url, { width, height, crop: 'limit' });
  const srcSet = getResponsiveSrcSet(url);

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-[#0A193C] ${className}`}>
      <img
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`transition-transform duration-500 ease-out ${imgClassName}`}
      />
    </div>
  );
}
