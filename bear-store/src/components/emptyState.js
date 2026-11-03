/**
 * Custom SVG Empty State Illustrations
 * Editorial, bespoke vector graphics for empty bag, wishlist, search results, and orders.
 */

export function renderEmptyIllustration(type = 'bag') {
  if (type === 'bag' || type === 'cart') {
    return `
      <svg class="w-24 h-24 sm:w-28 sm:h-28 mx-auto text-zinc-300 mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="34" width="56" height="52" rx="10" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 3" fill="var(--color-surface, #F8F7F5)" />
        <path d="M35 34V26C35 17.7157 41.7157 11 50 11C58.2843 11 65 17.7157 65 26V34" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="50" cy="56" r="6" stroke="currentColor" stroke-width="2" />
        <path d="M50 52V60M46 56H54" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        <path d="M28 86H72" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4" />
      </svg>
    `;
  }

  if (type === 'wishlist') {
    return `
      <svg class="w-24 h-24 sm:w-28 sm:h-28 mx-auto text-zinc-300 mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 82L47.1 79.35C26.8 60.95 13.5 48.88 13.5 33.75C13.5 21.43 23.18 11.75 35.5 11.75C42.45 11.75 49.12 14.98 50 16.03C50.88 14.98 57.55 11.75 64.5 11.75C76.82 11.75 86.5 21.43 86.5 33.75C86.5 48.88 73.2 60.95 52.9 79.35L50 82Z" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 3" fill="var(--color-surface, #F8F7F5)" />
        <circle cx="50" cy="42" r="8" stroke="currentColor" stroke-width="2" />
        <path d="M46 42L49 45L55 39" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  if (type === 'search') {
    return `
      <svg class="w-24 h-24 sm:w-28 sm:h-28 mx-auto text-zinc-300 mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="45" cy="45" r="26" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 3" fill="var(--color-surface, #F8F7F5)" />
        <path d="M64 64L85 85" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        <line x1="45" y1="35" x2="45" y2="55" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6" />
        <line x1="35" y1="45" x2="55" y2="45" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6" />
      </svg>
    `;
  }

  // Default: Orders / Box
  return `
    <svg class="w-24 h-24 sm:w-28 sm:h-28 mx-auto text-zinc-300 mb-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15L82 32V68L50 85L18 68V32L50 15Z" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 3" fill="var(--color-surface, #F8F7F5)" />
      <path d="M18 32L50 50L82 32" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M50 50V85" stroke="currentColor" stroke-width="2.5" />
    </svg>
  `;
}

export default { renderEmptyIllustration };

