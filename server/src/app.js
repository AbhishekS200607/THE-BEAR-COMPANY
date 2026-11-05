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

  // Flexible Local & Configured Production CORS
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  const isLocalDevOrigin = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server), matched origins, or any localhost dev port
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || isLocalDevOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Blocked by CORS policy'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    })
  );

  // Request Parsers with payload limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

