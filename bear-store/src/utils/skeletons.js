/**
 * BEAR Store — Skeleton Loaders
 * Centralized shimmer skeleton builders for every page/component.
 */

// ── Base shimmer block ────────────────────────────────────────
const S = (cls) => `<div class="skeleton ${cls}"></div>`;

// ── Product card skeleton ─────────────────────────────────────
export function skeletonProductCard() {
  return `
    <div class="bg-white border border-zinc-200/80 p-2 sm:p-2.5 rounded-none">
      <div class="skeleton aspect-square w-full rounded-none mb-2"></div>
      <div class="px-0.5 space-y-1.5">
        ${S('h-2.5 w-16 rounded')}
        ${S('h-3 w-full rounded')}
        ${S('h-3 w-2/3 rounded')}
        <div class="flex items-center justify-between pt-2 border-t border-zinc-100 mt-2">
          <div class="flex gap-1">
            ${S('w-3 h-3 rounded-full')}
            ${S('w-3 h-3 rounded-full')}
            ${S('w-3 h-3 rounded-full')}
          </div>
          ${S('h-6 w-14 rounded-full')}
        </div>
      </div>
    </div>
  `;
}

// ── Product grid skeleton (n cards) ──────────────────────────
export function skeletonProductGrid(count = 8) {
  return `
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4">
      ${Array.from({ length: count }, skeletonProductCard).join('')}
    </div>
  `;
}

// ── Home page skeleton ────────────────────────────────────────
export function skeletonHome() {
  return `
    <div class="w-full flex flex-col pt-20 md:pt-24 pb-28">
      <!-- Hero -->
      <div class="max-w-[1360px] mx-auto px-4 md:px-8 mt-2 mb-6 w-full">
        <div class="skeleton w-full min-h-[440px] md:min-h-[580px] rounded-2xl"></div>
      </div>
      <!-- Category pills -->
      <div class="max-w-[1360px] mx-auto px-4 md:px-8 mb-6 w-full">
        <div class="flex items-end justify-between mb-3">
          ${S('h-6 w-36 rounded')}
          ${S('h-4 w-20 rounded')}
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
          ${Array.from({ length: 4 }, () => `
            <div class="bg-white border border-zinc-200/80 rounded-xl p-3 pb-4">
              ${S('aspect-square w-full rounded-lg mb-2')}
              ${S('h-3 w-3/4 mx-auto rounded')}
              ${S('h-2.5 w-1/2 mx-auto rounded mt-1')}
            </div>
          `).join('')}
        </div>
      </div>
      <!-- Product grid -->
      <div class="max-w-[1360px] mx-auto px-4 md:px-8 w-full">
        <div class="flex items-end justify-between mb-3">
          ${S('h-6 w-48 rounded')}
          ${S('h-4 w-16 rounded')}
        </div>
        ${skeletonProductGrid(8)}
      </div>
    </div>
  `;
}

// ── Collection page skeleton ──────────────────────────────────
export function skeletonCollection() {
  return `
    <div class="w-full flex flex-col pt-20 md:pt-24 pb-32">
      <div class="w-full max-w-[1360px] mx-auto">
        <!-- Header -->
        <div class="px-5 pt-4 pb-3 space-y-1">
          ${S('h-7 w-48 rounded')}
          ${S('h-3 w-32 rounded')}
        </div>
        <!-- Category pills -->
        <div class="px-5 py-3 flex gap-2">
          ${Array.from({ length: 5 }, () => S('h-7 w-16 rounded-full')).join('')}
        </div>
        <!-- Filter bar -->
        <div class="px-5 py-2.5 border-b border-zinc-100 flex items-center justify-between">
          <div class="flex gap-2">
            ${S('h-7 w-20 rounded-md')}
            ${S('h-7 w-20 rounded-md')}
          </div>
          ${S('h-7 w-28 rounded-md')}
        </div>
        <!-- Grid -->
        <div class="px-4 pt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4">
          ${Array.from({ length: 8 }, skeletonProductCard).join('')}
        </div>
      </div>
    </div>
  `;
}

// ── Product detail page skeleton ─────────────────────────────
export function skeletonProduct() {
  return `
    <div class="max-w-[1360px] mx-auto w-full px-4 sm:px-6 md:px-8 pt-20 md:pt-24 pb-24">
      ${S('h-4 w-36 rounded mb-6')}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Gallery -->
        <div class="lg:col-span-7 flex flex-col md:flex-row gap-4">
          <div class="order-2 md:order-1 flex md:flex-col gap-3 md:w-24 shrink-0">
            ${Array.from({ length: 3 }, () => S('w-20 h-24 rounded-xl')).join('')}
          </div>
          <div class="order-1 md:order-2 flex-1">
            ${S('aspect-[3/4] w-full rounded-2xl')}
          </div>
        </div>
        <!-- Info -->
        <div class="lg:col-span-5 space-y-4 pt-2">
          ${S('h-3 w-24 rounded')}
          ${S('h-8 w-3/4 rounded')}
          ${S('h-5 w-32 rounded')}
          ${S('h-16 w-full rounded')}
          <!-- Colour swatches -->
          <div class="flex gap-2 pt-1">
            ${Array.from({ length: 4 }, () => S('w-8 h-8 rounded-full')).join('')}
          </div>
          <!-- Size grid -->
          <div class="grid grid-cols-5 gap-2">
            ${Array.from({ length: 5 }, () => S('h-12 rounded-xl')).join('')}
          </div>
          ${S('h-14 w-full rounded-full mt-2')}
        </div>
      </div>
    </div>
  `;
}

// ── Account page skeleton ─────────────────────────────────────
export function skeletonAccount() {
  return `
    <div class="w-full max-w-[1100px] mx-auto px-4 pt-20 md:pt-24 pb-32">
      ${S('h-7 w-48 rounded mb-6')}
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <!-- Sidebar -->
        <div class="md:col-span-4 bg-white border border-zinc-200 rounded-none sm:rounded-sm p-2 space-y-1.5">
          ${Array.from({ length: 7 }, () => S('h-10 w-full rounded-sm')).join('')}
        </div>
        <!-- Content -->
        <div class="md:col-span-8 space-y-4">
          ${S('h-24 w-full rounded-xl')}
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${Array.from({ length: 4 }, () => S('h-20 rounded-xl')).join('')}
          </div>
          ${S('h-64 w-full rounded-xl')}
        </div>
      </div>
    </div>
  `;
}

// ── Wishlist page skeleton ────────────────────────────────────
export function skeletonWishlist() {
  return `
    <div class="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-24 pb-32">
      <div class="flex items-center justify-between mb-8">
        <div class="space-y-1.5">
          ${S('h-3 w-28 rounded')}
          ${S('h-8 w-40 rounded')}
        </div>
        ${S('h-10 w-40 rounded-full')}
      </div>
      ${skeletonProductGrid(8)}
    </div>
  `;
}

// ── Cart page skeleton ────────────────────────────────────────
export function skeletonCart() {
  return `
    <div class="w-full max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-24 pb-32">
      ${S('h-7 w-32 rounded mb-6')}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-7 space-y-3">
          ${Array.from({ length: 3 }, () => `
            <div class="flex gap-3 py-4 border-b border-zinc-100">
              ${S('w-16 h-20 rounded-lg shrink-0')}
              <div class="flex-1 space-y-2">
                ${S('h-3 w-3/4 rounded')}
                ${S('h-3 w-1/2 rounded')}
                ${S('h-8 w-28 rounded-full mt-3')}
              </div>
              ${S('h-4 w-16 rounded shrink-0')}
            </div>
          `).join('')}
        </div>
        <div class="lg:col-span-5 space-y-3">
          ${S('h-48 w-full rounded-xl')}
          ${S('h-12 w-full rounded-full')}
        </div>
      </div>
    </div>
  `;
}

// ── Generic content page skeleton (contact, manifesto, etc.) ─
export function skeletonContentPage() {
  return `
    <div class="w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32">
      <!-- Header -->
      <div class="text-center mb-12 space-y-3">
        ${S('h-3 w-32 rounded mx-auto')}
        ${S('h-9 w-64 rounded mx-auto')}
        ${S('h-4 w-80 rounded mx-auto')}
      </div>
      <!-- 3 cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        ${Array.from({ length: 3 }, () => `
          <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5 space-y-2">
            ${S('h-10 w-10 rounded-full')}
            ${S('h-4 w-3/4 rounded mt-2')}
            ${S('h-3 w-full rounded')}
            ${S('h-3 w-5/6 rounded')}
          </div>
        `).join('')}
      </div>
      <!-- Form block -->
      <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-6 space-y-4">
        ${S('h-5 w-48 rounded')}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${Array.from({ length: 4 }, () => S('h-10 w-full rounded-sm')).join('')}
        </div>
        ${S('h-10 w-full rounded-sm')}
        ${S('h-24 w-full rounded-sm')}
        ${S('h-11 w-full rounded-full mt-2')}
      </div>
    </div>
  `;
}

export default {
  skeletonProductCard,
  skeletonProductGrid,
  skeletonHome,
  skeletonCollection,
  skeletonProduct,
  skeletonAccount,
  skeletonWishlist,
  skeletonCart,
  skeletonContentPage,
};
