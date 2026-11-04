import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { connectDatabase, isDatabaseConnected } from '../config/database.ts';
import { env } from '../config/env.ts';
import { Admin, AdminSession } from '../models/index.ts';

export const SESSION_COOKIE_NAME = 'gsc_admin_session';

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  admin?: AuthenticatedAdmin;
  adminSession?: {
    id: string;
    csrfToken: string;
    tokenHash: string;
  };
}

const EPHEMERAL_PROCESS_SECRET = crypto.randomBytes(32).toString('hex');

export function hashSessionToken(rawToken: string): string {
  const secret = env.SESSION_SECRET || EPHEMERAL_PROCESS_SECRET;
  return crypto.createHmac('sha256', secret).update(rawToken).digest('hex');
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function sanitizeString(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/\bon[a-z]+\s*=/gi, '');
}

function sanitizeValue(input: unknown): unknown {
  if (typeof input === 'string') {
    return sanitizeString(input);
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeValue);
  }
  if (input && typeof input === 'object' && !(input instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      // Prevent NoSQL operator injection ($gt, $ne, $where, dotted paths)
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      cleaned[key] = sanitizeValue(val);
    }
    return cleaned;
  }
  return input;
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    const cleanParams = sanitizeValue(req.params) as Record<string, string>;
    for (const key of Object.keys(req.params)) {
      if (!(key in cleanParams)) {
        delete req.params[key];
      } else {
        req.params[key] = cleanParams[key];
      }
    }
  }
  next();
}

export async function requireDatabase(_req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isDatabaseConnected()) {
    const connected = await connectDatabase();
    if (!connected) {
      res.status(503).json({
        error:
          'Database service is currently unavailable. Configure MONGODB_URI in your environment settings to enable live database operations.',
        code: 'DATABASE_UNAVAILABLE',
      });
      return;
    }
  }
  next();
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (!rawToken || typeof rawToken !== 'string') {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }

    if (!isDatabaseConnected()) {
      const connected = await connectDatabase();
      if (!connected) {
        res.status(503).json({
          error: 'Database connection is not configured. Configure MONGODB_URI to sign in.',
          code: 'DATABASE_UNAVAILABLE',
        });
        return;
      }
    }

    const tokenHash = hashSessionToken(rawToken);
    const session = await AdminSession.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!session) {
      res.status(401).json({ error: 'Session expired or invalid. Please sign in again.', code: 'UNAUTHENTICATED' });
      return;
    }

    const admin = await Admin.findById(session.adminId).lean();
    if (!admin) {
      res.status(401).json({ error: 'Administrator account not found.', code: 'UNAUTHENTICATED' });
      return;
    }

    if (!admin.isActive || (admin.role !== 'super_admin' && admin.role !== 'admin')) {
      res.status(403).json({ error: 'Access denied. Administrator account is not authorised.', code: 'FORBIDDEN' });
      return;
    }

    req.admin = {
      id: String(admin._id),
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role as 'super_admin' | 'admin',
    };

    req.adminSession = {
      id: String(session._id),
      csrfToken: session.csrfToken,
      tokenHash: session.tokenHash,
    };

    next();
  } catch (err) {
    console.error('[Security] Admin session verification failed:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Unable to verify administrator session.' });
  }
}

export function verifyCsrf(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method.toUpperCase())) {
    next();
    return;
  }

  const headerToken = req.headers['x-csrf-token'];
  const expectedToken = req.adminSession?.csrfToken;

  if (!headerToken || typeof headerToken !== 'string' || !expectedToken) {
    res.status(403).json({ error: 'Invalid or missing security token (CSRF). Please refresh and try again.' });
    return;
  }

  const headerBuf = Buffer.from(headerToken, 'utf8');
  const expectedBuf = Buffer.from(expectedToken, 'utf8');

  if (headerBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(headerBuf, expectedBuf)) {
    res.status(403).json({ error: 'Security token mismatch (CSRF).' });
    return;
  }

  next();
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts from this network. Please wait 15 minutes before trying again.',
  },
});

export const publicSubmissionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many form submissions in a short period. Please wait a few minutes and try again.',
  },
});

export const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded. Please wait before making further requests.',
  },
});
