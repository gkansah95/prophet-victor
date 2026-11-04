import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env, isMongoConfigured } from '../server/config/env.ts';
import { Admin } from '../server/models/index.ts';

async function setupAdmin() {
  if (!isMongoConfigured()) {
    console.error('Error: MONGODB_URI is not set in your .env file.');
    process.exit(1);
  }

  const email = (process.argv[2] || env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.argv[3] || env.ADMIN_INITIAL_PASSWORD || '';
  const displayName = (process.argv[4] || env.ADMIN_DISPLAY_NAME || 'Prophet Victor A.Y.').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: npm run setup-admin -- <admin-email> <strong-password> "[Display Name]"');
    console.error('Or set ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD in .env and run: npm run setup-admin');
    process.exit(1);
  }

  if (!password || password.length < 10) {
    console.error('Error: Administrator password must be at least 10 characters long.');
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await Admin.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        passwordHash,
        displayName,
        role: 'super_admin',
        isActive: true,
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );

  console.log(`Administrator account provisioned (${admin.displayName}).`);
  await mongoose.disconnect();
}

setupAdmin().catch((err) => {
  console.error('Failed to set up administrator account:', err instanceof Error ? err.message : err);
  process.exit(1);
});
