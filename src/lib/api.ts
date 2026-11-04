import type { CloudImage } from '../types/cms';

const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || '').replace(/\/$/, '');

let currentCsrfToken: string | null = null;

export function setApiCsrfToken(token: string | null): void {
  currentCsrfToken = token;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (options.method || 'GET').toUpperCase();
  if (currentCsrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('X-CSRF-Token', currentCsrfToken);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  let payload: Record<string, unknown> = {};
  if (contentType.includes('application/json')) {
    payload = (await response.json()) as Record<string, unknown>;
  }

  if (!response.ok) {
    const message =
      (typeof payload.error === 'string' && payload.error) ||
      `Request failed with status ${response.status}`;
    const code = typeof payload.code === 'string' ? payload.code : undefined;
    throw new ApiError(message, response.status, code);
  }

  return payload as T;
}

interface SignedUploadResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
}

const ALLOWED_CLIENT_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
const MAX_CLIENT_BYTES = 10 * 1024 * 1024;

export async function uploadSignedCloudinaryImage(
  file: File,
  folder: string,
  altText = '',
  onProgress?: (percent: number) => void
): Promise<CloudImage> {
  if (!ALLOWED_CLIENT_MIMES.includes(file.type.toLowerCase())) {
    throw new Error('Unsupported file format. Please choose a JPG, PNG, WebP, or AVIF image.');
  }

  if (file.size <= 0 || file.size > MAX_CLIENT_BYTES) {
    throw new Error('Image exceeds the maximum allowed size of 10 MB.');
  }

  // Step 1 & 2: Backend verifies admin session and generates signed Cloudinary parameters
  const signed = await apiFetch<SignedUploadResponse>('/api/admin/media/sign-upload', {
    method: 'POST',
    body: JSON.stringify({
      folder,
      mimeType: file.type,
      fileSize: file.size,
    }),
  });

  // Step 3 & 4: Upload directly to Cloudinary over HTTPS with signed parameters
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signed.apiKey);
  formData.append('timestamp', String(signed.timestamp));
  formData.append('signature', signed.signature);
  formData.append('folder', signed.folder);
  formData.append('allowed_formats', signed.allowedFormats);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`;

  const cloudinaryResult = await new Promise<{
    secure_url: string;
    public_id: string;
    format: string;
    bytes: number;
    width: number;
    height: number;
  }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300 && parsed.secure_url && parsed.public_id) {
          resolve(parsed);
        } else {
          reject(
            new Error(
              parsed?.error?.message || 'Cloudinary rejected the image upload. Verify format and credentials.'
            )
          );
        }
      } catch {
        reject(new Error('Invalid response received from Cloudinary upload endpoint.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error while uploading image to Cloudinary.'));
    };

    xhr.send(formData);
  });

  // Step 6: Persist metadata and publicId in MongoDB mediaAssets collection
  await apiFetch('/api/admin/media/register', {
    method: 'POST',
    body: JSON.stringify({
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      folder: signed.folder,
      format: cloudinaryResult.format || '',
      bytes: cloudinaryResult.bytes || file.size,
      width: cloudinaryResult.width || 0,
      height: cloudinaryResult.height || 0,
      alt: altText,
    }),
  });

  return {
    url: cloudinaryResult.secure_url,
    publicId: cloudinaryResult.public_id,
    alt: altText,
    width: cloudinaryResult.width || 0,
    height: cloudinaryResult.height || 0,
  };
}
