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

export function autoEncodeMongoUri(rawUri: string): string {
  const trimmed = rawUri.trim();
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    return trimmed;
  }

  // Remove any accidental < > brackets around the password
  const cleaned = trimmed.replace(/<([^>]+)>/g, '$1');

  const protocolMatch = cleaned.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
  if (!protocolMatch) return cleaned;

  const protocol = protocolMatch[1];
  const afterProtocol = protocolMatch[2];

  const pathOrQueryIndex = afterProtocol.search(/[/?]/);
  const authority = pathOrQueryIndex === -1 ? afterProtocol : afterProtocol.slice(0, pathOrQueryIndex);
  const pathAndQuery = pathOrQueryIndex === -1 ? '' : afterProtocol.slice(pathOrQueryIndex);

  const lastAtIndex = authority.lastIndexOf('@');
  if (lastAtIndex === -1) return cleaned;

  const userInfo = authority.slice(0, lastAtIndex);
  const host = authority.slice(lastAtIndex + 1);

  const firstColonIndex = userInfo.indexOf(':');
  if (firstColonIndex === -1) return cleaned;

  const user = userInfo.slice(0, firstColonIndex);
  const rawPassword = userInfo.slice(firstColonIndex + 1);

  let decodedPassword = rawPassword;
  try {
    decodedPassword = decodeURIComponent(rawPassword);
  } catch {
    // keep raw
  }

  let decodedUser = user;
  try {
    decodedUser = decodeURIComponent(user);
  } catch {
    // keep raw
  }

  return `${protocol}${encodeURIComponent(decodedUser)}:${encodeURIComponent(decodedPassword)}@${host}${pathAndQuery}`;
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
      const sanitizedUri = autoEncodeMongoUri(env.MONGODB_URI);

      await mongoose.connect(sanitizedUri, {
        serverSelectionTimeoutMS: 7000,
        authSource: 'admin',
      });
      lastConnectionError = null;
      await bootstrapInitialAdminIfConfigured();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('bad auth') || msg.includes('Authentication failed')) {
        lastConnectionError =
          'MongoDB authentication failed (bad auth). Please check: 1) Your database user password in MONGODB_URI matches MongoDB Atlas. 2) In Atlas -> Database Access, verify "gkansah95_db_user" has "Read and write to any database" privileges.';
      } else {
        lastConnectionError =
          err instanceof Error
            ? `Unable to connect to MongoDB Atlas (${err.message}). Please verify MONGODB_URI and network IP allowlist.`
            : 'Unknown database connection error.';
      }
      console.warn('[Database] ' + lastConnectionError);
      return false;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}
