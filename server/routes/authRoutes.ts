import crypto from 'node:crypto';
import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { connectDatabase, getDatabaseConnectionError, isDatabaseConnected } from '../config/database.ts';
import { env, getSessionCookieOptions, isCloudinaryConfigured, isMongoConfigured } from '../config/env.ts';
import {
  generateSecureToken,
  hashSessionToken,
  loginRateLimiter,
  requireAdmin,
  requireDatabase,
  SESSION_COOKIE_NAME,
  verifyCsrf,
  type AuthenticatedRequest,
} from '../middleware/security.ts';
import { Admin, AdminSession } from '../models/index.ts';
import { formatZodError, loginSchema, updateAdminAccountSchema } from '../validators/schemas.ts';

const router = Router();

// Generated in memory at runtime to prevent timing enumeration without storing any hash literal in Git
let runtimeDummyHashPromise: Promise<string> | null = null;
function getDummyPasswordHash(): Promise<string> {
  if (!runtimeDummyHashPromise) {
    runtimeDummyHashPromise = bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
  }
  return runtimeDummyHashPromise;
}

router.get('/session', async (req: AuthenticatedRequest, res: Response) => {
  const mongoConfigured = isMongoConfigured();
  let dbConnected = isDatabaseConnected();
  if (mongoConfigured && !dbConnected) {
    dbConnected = await connectDatabase();
  }

  let hasAdminAccount = false;
  if (dbConnected) {
    const count = await Admin.countDocuments();
    hasAdminAccount = count > 0;
  }

  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!dbConnected || !rawToken || typeof rawToken !== 'string') {
    res.json({
      authenticated: false,
      authorised: false,
      admin: null,
      csrfToken: null,
      system: {
        mongoConfigured,
        dbConnected,
        cloudinaryConfigured: isCloudinaryConfigured(),
        hasAdminAccount,
        dbError: getDatabaseConnectionError(),
      },
    });
    return;
  }

  const tokenHash = hashSessionToken(rawToken);
  const session = await AdminSession.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!session) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.json({
      authenticated: false,
      authorised: false,
      admin: null,
      csrfToken: null,
      system: {
        mongoConfigured,
        dbConnected,
        cloudinaryConfigured: isCloudinaryConfigured(),
        hasAdminAccount,
        dbError: getDatabaseConnectionError(),
      },
    });
    return;
  }

  const admin = await Admin.findById(session.adminId).lean();
  if (!admin) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.json({
      authenticated: false,
      authorised: false,
      admin: null,
      csrfToken: null,
      system: {
        mongoConfigured,
        dbConnected,
        cloudinaryConfigured: isCloudinaryConfigured(),
        hasAdminAccount,
        dbError: getDatabaseConnectionError(),
      },
    });
    return;
  }

  const authorised = Boolean(admin.isActive && (admin.role === 'super_admin' || admin.role === 'admin'));

  res.json({
    authenticated: true,
    authorised,
    admin: authorised
      ? {
          id: String(admin._id),
          email: admin.email,
          displayName: admin.displayName,
          role: admin.role,
        }
      : null,
    csrfToken: authorised ? session.csrfToken : null,
    system: {
      mongoConfigured,
      dbConnected,
      cloudinaryConfigured: isCloudinaryConfigured(),
      hasAdminAccount,
    },
  });
});

router.post('/login', loginRateLimiter, requireDatabase, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (env.NODE_ENV === 'production' && env.SESSION_SECRET.length < 32) {
      res.status(503).json({
        error: 'Server session security (SESSION_SECRET) must be configured before signing in.',
      });
      return;
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;

    const admin = await Admin.findOne({ email }).select('+passwordHash');

    if (!admin) {
      const dummyHash = await getDummyPasswordHash();
      await bcrypt.compare(password, dummyHash);
      res.status(401).json({ error: 'Invalid email address or password.' });
      return;
    }

    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const minutesRemaining = Math.max(1, Math.ceil((admin.lockUntil.getTime() - Date.now()) / 60000));
      res.status(423).json({
        error: `Account temporarily locked due to repeated failed sign-in attempts. Try again in ${minutesRemaining} minute(s).`,
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      const attempts = (admin.failedLoginAttempts || 0) + 1;
      const updateFields: Record<string, unknown> = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        updateFields.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        updateFields.failedLoginAttempts = 0;
      }
      await Admin.updateOne({ _id: admin._id }, { $set: updateFields });
      res.status(401).json({ error: 'Invalid email address or password.' });
      return;
    }

    if (!admin.isActive || (admin.role !== 'super_admin' && admin.role !== 'admin')) {
      res.status(403).json({ error: 'Access denied. This account is not authorised for administration.' });
      return;
    }

    await Admin.updateOne(
      { _id: admin._id },
      {
        $set: {
          failedLoginAttempts: 0,
          lockUntil: null,
          lastLoginAt: new Date(),
        },
      }
    );

    const rawSessionToken = generateSecureToken(32);
    const tokenHash = hashSessionToken(rawSessionToken);
    const csrfToken = generateSecureToken(24);
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

    await AdminSession.create({
      tokenHash,
      csrfToken,
      adminId: admin._id,
      ipAddress: String(req.ip || ''),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 250),
      expiresAt,
    });

    res.cookie(SESSION_COOKIE_NAME, rawSessionToken, getSessionCookieOptions());

    res.json({
      authenticated: true,
      authorised: true,
      admin: {
        id: String(admin._id),
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
      },
      csrfToken,
    });
  } catch (err) {
    console.error('[Auth] Login failed:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'An unexpected error occurred during sign-in.' });
  }
});

router.post('/logout', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (rawToken && typeof rawToken === 'string' && isDatabaseConnected()) {
      const tokenHash = hashSessionToken(rawToken);
      await AdminSession.deleteOne({ tokenHash });
    }
  } catch (err) {
    console.error('[Auth] Logout cleanup warning:', err instanceof Error ? err.message : err);
  }

  const cookieOpts = getSessionCookieOptions();
  res.clearCookie(SESSION_COOKIE_NAME, {
    path: cookieOpts.path,
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
  });

  res.json({ success: true });
});

router.put(
  '/account',
  requireDatabase,
  requireAdmin,
  verifyCsrf,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = updateAdminAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: formatZodError(parsed.error) });
        return;
      }

      const adminDoc = await Admin.findById(req.admin!.id).select('+passwordHash');
      if (!adminDoc) {
        res.status(404).json({ error: 'Administrator record not found.' });
        return;
      }

      const validCurrent = await bcrypt.compare(parsed.data.currentPassword, adminDoc.passwordHash);
      if (!validCurrent) {
        res.status(401).json({ error: 'Current password is incorrect.' });
        return;
      }

      const normalizedEmail = parsed.data.email.toLowerCase().trim();
      if (normalizedEmail !== adminDoc.email) {
        const duplicate = await Admin.findOne({
          email: normalizedEmail,
          _id: { $ne: adminDoc._id },
        }).lean();
        if (duplicate) {
          res.status(409).json({ error: 'Another account already uses that email address.' });
          return;
        }
      }

      adminDoc.email = normalizedEmail;
      adminDoc.displayName = parsed.data.displayName.trim();

      if (parsed.data.newPassword && parsed.data.newPassword.length >= 10) {
        adminDoc.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
        // Revoke all other sessions when password is changed
        if (req.adminSession?.tokenHash) {
          await AdminSession.deleteMany({
            adminId: adminDoc._id,
            tokenHash: { $ne: req.adminSession.tokenHash },
          });
        }
      }

      await adminDoc.save();

      res.json({
        admin: {
          id: String(adminDoc._id),
          email: adminDoc.email,
          displayName: adminDoc.displayName,
          role: adminDoc.role,
        },
        message: 'Account settings updated securely.',
      });
    } catch (err) {
      console.error('[Auth] Account update failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Failed to update administrator account settings.' });
    }
  }
);

export default router;
