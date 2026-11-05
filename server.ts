import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createExpressApp } from './server/app.ts';
import { connectDatabase } from './server/config/database.ts';
import { env, isMongoConfigured } from './server/config/env.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createExpressApp();

  // Attempt initial MongoDB Atlas connection if MONGODB_URI is configured
  if (isMongoConfigured()) {
    await connectDatabase();
  }

  // Serve Frontend (Vite middleware in development; static dist in production)
  const distPath = path.join(__dirname, 'dist');
  const isProdBuildReady = env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProdBuildReady) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(distPath, {
        maxAge: '7d',
        index: false,
      })
    );
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Central non-leaking error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server] Unhandled error:', err.message);
    if (res.headersSent) {
      return;
    }
    res.status(500).json({ error: 'An internal server error occurred.' });
  });

  const port = env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Server] Global Seekers Chapel platform listening on http://0.0.0.0:${port}`);
  });
}

startServer();
