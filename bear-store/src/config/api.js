/**
 * BEAR Store — Centralized API Configuration
 * 
 * Automatically resolves the backend API origin:
 * - In Vercel/Production: Uses VITE_API_BASE_URL, or defaults to the deployed backend.
 * - In Local Development: Falls back to http://localhost:4000.
 */

const envUrl = import.meta.env.VITE_API_BASE_URL;

function getBaseUrl() {
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://the-bear-company.vercel.app';
    }
  }

  return 'http://localhost:4000';
}

export const API_BASE = getBaseUrl();
export const API_V1 = `${API_BASE}/api/v1`;
