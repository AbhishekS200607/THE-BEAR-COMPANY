import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[BEAR API] Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`[BEAR API] WhatsApp Business Number: +${env.WHATSAPP_BUSINESS_NUMBER}`);
  console.log(`[BEAR API] CORS Allowed Origin: ${env.CORS_ORIGIN}`);
});

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(`[BEAR API] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[BEAR API] HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[BEAR API] Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

