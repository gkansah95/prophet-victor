import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from './env.ts';

const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_FOLDERS = [
  'gsc/profile',
  'gsc/slider',
  'gsc/sermons',
  'gsc/events',
  'gsc/books',
  'gsc/gallery',
  'gsc/testimonies',
  'gsc/blog',
  'gsc/settings',
];

export function configureCloudinary(): void {
  if (!isCloudinaryConfigured()) {
    return;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface SignedUploadInput {
  folder: string;
  mimeType: string;
  fileSize: number;
}

export function validateUploadRequest(input: SignedUploadInput): { valid: boolean; error?: string } {
  if (!ALLOWED_FOLDERS.includes(input.folder)) {
    return { valid: false, error: 'Invalid media destination folder.' };
  }

  const normalizedMime = input.mimeType.toLowerCase();
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  if (!allowedMimes.includes(normalizedMime)) {
    return {
      valid: false,
      error: 'Unsupported image format. Allowed formats: JPG, PNG, WebP, and AVIF.',
    };
  }

  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0 || input.fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Image file size must be greater than 0 bytes and must not exceed 10 MB.',
    };
  }

  return { valid: true };
}

export function createSignedUploadParams(folder: string) {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured.'
    );
  }

  configureCloudinary();

  const timestamp = Math.round(Date.now() / 1000);
  const allowedFormats = ALLOWED_IMAGE_FORMATS.join(',');

  const paramsToSign: Record<string, string | number> = {
    allowed_formats: allowedFormats,
    folder,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    allowedFormats,
  };
}

export async function destroyCloudinaryAsset(publicId: string): Promise<boolean> {
  if (!publicId || !isCloudinaryConfigured()) {
    return false;
  }

  // Only allow deleting assets inside our managed namespace
  if (!publicId.startsWith('gsc/')) {
    return false;
  }

  configureCloudinary();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
    invalidate: true,
  });

  return result?.result === 'ok' || result?.result === 'not found';
}
