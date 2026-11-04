import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env, isMongoConfigured } from './env.ts';
import { Admin } from '../models/index.ts';

let lastConnectionError: string | null = null;
let connectingPromise: Promise<boolean> | null = null;

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getDatabaseConnectionError(): string | null {
  return lastConnectionError;
}

async function bootstrapInitialAdminIfConfigured(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_INITIAL_PASSWORD) {
    return;
  }

  if (env.ADMIN_INITIAL_PASSWORD.length < 10) {
    console.warn(
      '[Security] ADMIN_INITIAL_PASSWORD must be at least 10 characters long to auto-provision the initial administrator.'
    );
    return;
  }

  const existingCount = await Admin.countDocuments();
  if (existingCount > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_INITIAL_PASSWORD, 12);
  await Admin.create({
    email: env.ADMIN_EMAIL,
    passwordHash,
    displayName: env.ADMIN_DISPLAY_NAME || 'Prophet Victor A.Y.',
    role: 'super_admin',
    isActive: true,
  });

  console.log('[Security] Provisioned initial administrator account.');
}

export async function connectDatabase(): Promise<boolean> {
  if (!isMongoConfigured()) {
    lastConnectionError =
      'MONGODB_URI is not configured. Set a valid MongoDB Atlas connection string in your environment variables.';
    return false;
  }

  if (isDatabaseConnected()) {
    return true;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 7000,
      });
      lastConnectionError = null;
      await bootstrapInitialAdminIfConfigured();
      return true;
    } catch (err) {
      lastConnectionError =
        err instanceof Error
          ? 'Unable to connect to MongoDB Atlas. Please verify MONGODB_URI and network IP allowlist.'
          : 'Unknown database connection error.';
      console.error('[Database] MongoDB connection error:', err instanceof Error ? err.message : err);
      return false;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}
