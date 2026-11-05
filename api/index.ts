import { createExpressApp } from '../server/app.ts';
import { connectDatabase } from '../server/config/database.ts';
import { isMongoConfigured } from '../server/config/env.ts';

const app = createExpressApp();

export default async function handler(req: any, res: any) {
  if (isMongoConfigured()) {
    try {
      await connectDatabase();
    } catch (err) {
      console.error('[Vercel Serverless] Database connection error:', err);
    }
  }
  return app(req, res);
}
