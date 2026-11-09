import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Network compression: shrinks JSON/text responses > 1KB by up to 80%
  app.use(
    compression({
      threshold: 1024,
      level: 6,
    })
  );

  // Instant Favicon Handler (204 No Content to eliminate 1.5s-3.5s wasteful 404 overhead)
  app.get('/favicon.ico', (req, res) => {
    res.set('Cache-Control', 'public, max-age=86400');
    return res.status(204).end();
  });

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Handled separately or configured per frontend origin
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Flexible Local, Vercel & Configured Production CORS
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  const isLocalDevOrigin = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
  const isVercelOrigin = (o) => /^https?:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(o);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin, matched origins, localhost dev ports, or any Vercel domain
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || isLocalDevOrigin(origin) || isVercelOrigin(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    })
  );

  // Request Parsers with payload limits (15mb to support WebP compressed uploads)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Friendly redirect for direct browser tracking visits
  app.get('/track-order', (req, res) => {
    const orderNumber = req.query.orderNumber || req.query.order_number || '';
    const storefront = env.STOREFRONT_URL || (env.NODE_ENV === 'production' ? 'https://the-bear-company.vercel.app' : 'http://localhost:5173');
    const clean = storefront.replace(/\/+$/, '');
    const destination = `${clean}/#/track-order${orderNumber ? `?orderNumber=${encodeURIComponent(orderNumber)}` : ''}`;
    return res.redirect(302, destination);
  });

  // Root health & status endpoints for deployment verification
  app.get(['/', '/api', '/health', '/api/health'], (req, res) => {
    // Fast JSON response for API clients, fetch calls, curl, and automated monitoring
    if (req.query.format === 'json' || req.accepts('json') || !req.accepts('html')) {
      return res.json({
        status: 'online',
        service: 'BEAR Performance API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    }

    // High-performance branded status landing page for human browser visits (avoids infinite self-redirect loops)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BEAR Performance API — Online</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #0b0b0b; color: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #141414; border: 1px solid #262626; border-radius: 12px; padding: 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #4ade80; background: rgba(74,222,128,0.1); padding: 4px 12px; border-radius: 999px; margin-bottom: 20px; }
    .badge::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 8px #4ade80; }
    h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 8px; text-transform: uppercase; }
    p { color: #888; font-size: 14px; margin: 0 0 24px; line-height: 1.5; }
    .actions { display: flex; flex-direction: column; gap: 10px; }
    a.btn { display: block; text-decoration: none; padding: 12px 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 6px; transition: all 0.2s; }
    a.btn-primary { background: #fff; color: #000; }
    a.btn-primary:hover { background: #e0e0e0; }
    a.btn-secondary { background: #1f1f1f; color: #ccc; border: 1px solid #333; }
    a.btn-secondary:hover { background: #2a2a2a; color: #fff; }
    .footer { margin-top: 24px; font-size: 11px; color: #555; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">API Online</div>
    <h1>BEAR Engine</h1>
    <p>High-performance REST API powering the BEAR storefront and admin portal.</p>
    <div class="actions">
      <a class="btn btn-primary" href="/api/v1/products">View Catalog API JSON</a>
      <a class="btn btn-secondary" href="/api/health">System Health Check</a>
    </div>
    <div class="footer">Version 1.0.0 &bull; ${new Date().toISOString()}</div>
  </div>
</body>
</html>`);
  });

  // Mount API version 1
  app.use('/api/v1', routes);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: { message: `Route ${req.method} ${req.originalUrl} not found` },
    });
  });

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
}

