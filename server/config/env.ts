import dotenv from 'dotenv';

dotenv.config();

function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = Number(process.argv[portArgIndex + 1]);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  // In Cloud Run / AI Studio container environment, PORT=8080 is used by Nginx reverse proxy.
  // The applet dev server must listen on port 3000.
  if (process.env.PORT && process.env.PORT !== '8080') {
    const parsed = Number(process.env.PORT);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: resolvePort(),
  APP_URL: (process.env.APP_URL || '').trim(),
  FRONTEND_URL: (process.env.FRONTEND_URL || '').trim(),
  MONGODB_URI: (process.env.MONGODB_URI || '').trim(),
  CLOUDINARY_CLOUD_NAME: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  CLOUDINARY_API_KEY: (process.env.CLOUDINARY_API_KEY || '').trim(),
  CLOUDINARY_API_SECRET: (process.env.CLOUDINARY_API_SECRET || '').trim(),
  SESSION_SECRET: (process.env.SESSION_SECRET || '').trim(),
  SESSION_TTL_HOURS: Math.max(1, Math.min(168, Number(process.env.SESSION_TTL_HOURS || 24))),
  COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE || '').trim().toLowerCase(),
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || '',
  ADMIN_DISPLAY_NAME: (process.env.ADMIN_DISPLAY_NAME || 'Prophet Victor A.Y.').trim(),
};

export function isMongoConfigured(): boolean {
  return Boolean(
    env.MONGODB_URI &&
      (env.MONGODB_URI.startsWith('mongodb://') || env.MONGODB_URI.startsWith('mongodb+srv://'))
  );
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
  );
}

export function isHttpsEnvironment(): boolean {
  return (
    env.NODE_ENV === 'production' ||
    env.APP_URL.startsWith('https://') ||
    env.FRONTEND_URL.startsWith('https://')
  );
}

export function getSessionCookieOptions() {
  const isHttps = isHttpsEnvironment();
  let sameSite: 'strict' | 'lax' | 'none' = 'lax';

  if (env.COOKIE_SAME_SITE === 'strict' || env.COOKIE_SAME_SITE === 'lax' || env.COOKIE_SAME_SITE === 'none') {
    sameSite = env.COOKIE_SAME_SITE;
  } else if (isHttps && env.APP_URL.includes('.run.app')) {
    // Allow HTTP-only session cookies inside HTTPS preview iframe while enforcing strict server-side CSRF tokens
    sameSite = 'none';
  } else if (isHttps) {
    sameSite = 'lax';
  }

  return {
    httpOnly: true,
    secure: isHttps || sameSite === 'none',
    sameSite,
    path: '/',
    maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
  };
}
