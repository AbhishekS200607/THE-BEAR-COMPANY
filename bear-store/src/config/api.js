/**
 * BEAR Store — Centralized API Configuration
 * 
 * Automatically resolves the backend API origin:
 * - In Vercel/Production: Uses relative path ('') or VITE_API_BASE_URL (bypasses CORS & mixed-content blocks).
 * - In Local Development: Falls back to http://localhost:4000.
 */

const envUrl = import.meta.env.VITE_API_BASE_URL;

function getBaseUrl() {
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If in browser and hosted on Vercel / non-localhost, use same-origin relative URLs
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return '';
    }
  }

  // Local development standalone fallback
  return 'http://localhost:4000';
}

export const API_BASE = getBaseUrl();
export const API_V1 = `${API_BASE}/api/v1`;
