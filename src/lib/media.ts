export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'thumb';
}

/**
 * Applies Cloudinary automatic format (f_auto) and quality (q_auto) optimisation
 * plus optional responsive width constraints without mutating non-Cloudinary URLs.
 */
export function getOptimizedImageUrl(url?: string, options: ImageTransformOptions = {}): string {
  if (!url) {
    return '';
  }

  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const transforms = ['f_auto', 'q_auto'];
  if (options.crop) {
    transforms.push(`c_${options.crop}`);
  } else if (options.width || options.height) {
    transforms.push('c_limit');
  }
  if (options.width) {
    transforms.push(`w_${options.width}`);
  }
  if (options.height) {
    transforms.push(`h_${options.height}`);
  }

  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
}

export function getResponsiveSrcSet(url?: string, widths = [480, 800, 1200, 1600]): string | undefined {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return undefined;
  }

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w, crop: 'limit' })} ${w}w`)
    .join(', ');
}

export function getYouTubeEmbedUrl(rawUrl?: string): string | null {
  if (!rawUrl || !rawUrl.trim()) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl.trim());
    let videoId = '';

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.replace(/^\//, '').split('/')[0];
    } else if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtube-nocookie.com')) {
      if (parsed.pathname.startsWith('/watch')) {
        videoId = parsed.searchParams.get('v') || '';
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.replace('/embed/', '').split('/')[0];
      } else if (parsed.pathname.startsWith('/live/')) {
        videoId = parsed.pathname.replace('/live/', '').split('/')[0];
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.replace('/shorts/', '').split('/')[0];
      }
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return null;
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
  } catch {
    return null;
  }
}

export function formatMinistryDate(dateInput?: string | Date | null): string {
  if (!dateInput) {
    return '';
  }
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function estimateReadingTime(content?: string): number {
  if (!content) {
    return 1;
  }
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
