import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

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
    // If a human visitor opens the root URL in a desktop/mobile web browser, redirect to the storefront
    if (req.path === '/' && req.accepts('html') && !req.query.format && env.STOREFRONT_URL) {
      const cleanStorefront = env.STOREFRONT_URL.replace(/\/+$/, '');
      try {
        const storeHost = new URL(cleanStorefront).host;
        if (storeHost && storeHost !== req.headers.host) {
          return res.redirect(302, cleanStorefront);
        }
      } catch {}
    }

    res.json({
      status: 'online',
      service: 'BEAR Performance API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
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

