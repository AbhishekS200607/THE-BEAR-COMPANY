import { createApp } from '../src/app.js';

let appInstance = null;

function getApp() {
  if (!appInstance) {
    try {
      appInstance = createApp();
    } catch (err) {
      console.error('[BEAR API Init Error]', err);
      throw err;
    }
  }
  return appInstance;
}

export default function handler(req, res) {
  try {
    const app = getApp();
    return app(req, res);
  } catch (err) {
    console.error('[BEAR API Invocation Error]', err);
    res.status(500).json({
      success: false,
      error: { message: err.message || 'Server initialization failed' },
    });
  }
}
