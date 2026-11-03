import { supabaseAdmin } from '../config/supabase.js';

let intervalTimer = null;
let isRunning = false;

/**
 * Executes a single sweep of expired reservations in PostgreSQL
 * @returns {Promise<number>} Number of released order reservations
 */
export async function sweepExpiredReservations() {
  if (isRunning) return 0;
  isRunning = true;

  try {
    const { data: releasedCount, error } = await supabaseAdmin.rpc('release_expired_reservations');

    if (error) {
      // Only log if it's not a generic connection issue during offline dev
      if (error.code !== 'ECONNREFUSED' && error.code !== 'PGRST301') {
        console.warn('[BEAR Reservation Worker] Sweep warning:', error.message);
      }
      return 0;
    }

    const count = Number(releasedCount) || 0;
    if (count > 0) {
      console.log(`[BEAR Reservation Worker] Successfully released ${count} expired order reservation(s).`);
    }
    return count;
  } catch (err) {
    console.error('[BEAR Reservation Worker] Unexpected sweep error:', err.message);
    return 0;
  } finally {
    isRunning = false;
  }
}

/**
 * Starts periodic background polling for expired reservations
 * @param {number} intervalMs - Polling interval in ms (default 60s)
 */
export function startReservationExpiryWorker(intervalMs = 60000) {
  if (intervalTimer) return;

  console.log(`[BEAR Reservation Worker] Started. Polling every ${Math.round(intervalMs / 1000)}s.`);
  
  // Initial sweep on boot
  sweepExpiredReservations();

  intervalTimer = setInterval(() => {
    sweepExpiredReservations();
  }, intervalMs);
}

/**
 * Stops the background worker cleanly on server shutdown
 */
export function stopReservationExpiryWorker() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
    console.log('[BEAR Reservation Worker] Stopped.');
  }
}

