import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { configureCloudinary } from './server/config/cloudinary.ts';
import { connectDatabase, isDatabaseConnected } from './server/config/database.ts';
import { env, isMongoConfigured } from './server/config/env.ts';
import { generalApiRateLimiter, sanitizeRequest } from './server/middleware/security.ts';
import { BlogPost, Event, Sermon } from './server/models/index.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import authRoutes from './server/routes/authRoutes.ts';
import publicRoutes from './server/routes/publicRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  // Configure Cloudinary if credentials exist
  configureCloudinary();

  // Attempt initial MongoDB Atlas connection if MONGODB_URI is configured
  if (isMongoConfigured()) {
    await connectDatabase();
  }

  // Security headers via Helmet (configured cleanly for Cloudinary images, YouTube embeds, and preview iframe)
  app.use(
    helmet({
      frameguard: false,
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy:
        env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
                imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
                mediaSrc: ["'self'", 'https://res.cloudinary.com', 'https:'],
                connectSrc: ["'self'", 'https://api.cloudinary.com', 'https://res.cloudinary.com'],
                frameSrc: [
                  "'self'",
                  'https://www.youtube.com',
                  'https://www.youtube-nocookie.com',
                  'https://player.vimeo.com',
                ],
                frameAncestors: ["'self'", 'https://*.google.com', 'https://*.run.app'],
              },
            }
          : false,
    })
  );

  // Strict CORS Policy
  const allowedOrigins = [env.FRONTEND_URL, env.APP_URL]
    .map((u) => u.replace(/\/$/, ''))
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        const normalized = origin.replace(/\/$/, '');
        if (
          allowedOrigins.length === 0 ||
          allowedOrigins.includes(normalized) ||
          normalized.endsWith('.run.app') ||
          normalized.includes('localhost:')
        ) {
          callback(null, true);
          return;
        }
        callback(new Error('Origin not permitted by CORS policy.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(sanitizeRequest);

  // SEO: robots.txt (explicitly disallows /admin and /api from search engine crawlers)
  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = (env.FRONTEND_URL || env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(
      /\/$/,
      ''
    );
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /admin/',
        'Disallow: /api/',
        `Sitemap: ${baseUrl}/sitemap.xml`,
      ].join('\n')
    );
  });

  // SEO: Dynamic XML Sitemap from published MongoDB records
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    const baseUrl = (env.FRONTEND_URL || env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(
      /\/$/,
      ''
    );

    const staticPaths = [
      '/',
      '/about',
      '/sermons',
      '/events',
      '/books',
      '/gallery',
      '/testimonies',
      '/blog',
      '/prayer-requests',
      '/contact',
    ];

    const dynamicPaths: { loc: string; lastmod?: string }[] = [];

    if (isDatabaseConnected()) {
      try {
        const [sermons, events, posts] = await Promise.all([
          Sermon.find({ status: 'published' }).select('slug updatedAt').lean(),
          Event.find({ status: 'published' }).select('slug updatedAt').lean(),
          BlogPost.find({ status: 'published' }).select('slug updatedAt').lean(),
        ]);

        for (const s of sermons) {
          dynamicPaths.push({
            loc: `/sermons/${encodeURIComponent(s.slug)}`,
            lastmod: s.updatedAt ? new Date(s.updatedAt).toISOString() : undefined,
          });
        }
        for (const e of events) {
          dynamicPaths.push({
            loc: `/events/${encodeURIComponent(e.slug)}`,
            lastmod: e.updatedAt ? new Date(e.updatedAt).toISOString() : undefined,
          });
        }
        for (const p of posts) {
          dynamicPaths.push({
            loc: `/blog/${encodeURIComponent(p.slug)}`,
            lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined,
          });
        }
      } catch {
        // Ignore transient DB read errors during sitemap rendering
      }
    }

    const xmlEntries = [
      ...staticPaths.map(
        (p) =>
          `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <changefreq>${p === '/' ? 'daily' : 'weekly'}</changefreq>\n    <priority>${p === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
      ),
      ...dynamicPaths.map(
        (d) =>
          `  <url>\n    <loc>${baseUrl}${d.loc}</loc>${d.lastmod ? `\n    <lastmod>${d.lastmod}</lastmod>` : ''}\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      ),
    ].join('\n');

    res
      .type('application/xml')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>`
      );
  });

  // REST API Routes
  app.use('/api', generalApiRateLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/admin', adminRoutes);

  // Unknown API 404 handler
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Serve Frontend (Vite middleware in development; static dist in production)
  const distPath = path.join(__dirname, 'dist');
  const isProdBuildReady = env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProdBuildReady) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
