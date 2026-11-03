/* ============================================================
   REACTIVE STORE — Custom event-based state management
   ============================================================ */

import { get, set } from '../utils/storage.js';

const STORAGE_KEYS = {
  mode: 'bear_mode',
  cart: 'bear_cart',
  wishlist: 'bear_wishlist',
};

// Initial state
let state = {
  mode: get(STORAGE_KEYS.mode) || 'bear',
  cart: get(STORAGE_KEYS.cart) || [],
  wishlist: get(STORAGE_KEYS.wishlist) || [],
  searchQuery: '',
  searchOpen: false,
  cartOpen: false,
  accountOpen: false,
};

/**
 * Get the full current state (shallow copy)
 */
export function getState() {
  return { ...state };
}

/**
 * Merge patch into state, persist relevant keys, dispatch event
 */
export function setState(patch) {
  state = { ...state, ...patch };

  // Persist to localStorage
  if (patch.mode !== undefined) set(STORAGE_KEYS.mode, state.mode);
  if (patch.cart !== undefined) set(STORAGE_KEYS.cart, state.cart);
  if (patch.wishlist !== undefined) set(STORAGE_KEYS.wishlist, state.wishlist);

  window.dispatchEvent(new CustomEvent('state-change', { detail: { ...state } }));
}

/**
 * Subscribe to state changes. Returns unsubscribe function.
 */
export function subscribe(listener) {
  const handler = (e) => listener(e.detail);
  window.addEventListener('state-change', handler);
  return () => window.removeEventListener('state-change', handler);
}

// ── Mode helpers ─────────────────────────────────────────────
export function getMode() {
  return state.mode;
}

export function setMode(mode) {
  if (mode !== 'bear' && mode !== 'sow') return;
  setState({ mode });
  document.documentElement.setAttribute('data-mode', mode);
  window.dispatchEvent(new CustomEvent('mode-change', { detail: { mode } }));
}

// ── Cart helpers ─────────────────────────────────────────────
export function getCart() {
  return [...state.cart];
}

export function getCartCount() {
  return state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

export function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
}

export function addToCart(item) {
  const cart = [...state.cart];
  const existing = cart.findIndex(
    (i) => i.id === item.id && i.size === item.size && i.colour === item.colour
  );
  if (existing >= 0) {
    cart[existing] = { ...cart[existing], quantity: (cart[existing].quantity || 1) + (item.quantity || 1) };
  } else {
    cart.push({ ...item, quantity: item.quantity || 1 });
  }
  setState({ cart });
}

export function removeFromCart(id, size, colour) {
  const cart = state.cart.filter(
    (i) => !(i.id === id && i.size === size && i.colour === colour)
  );
  setState({ cart });
}

export function updateCartQty(id, size, colour, qty) {
  if (qty <= 0) {
    removeFromCart(id, size, colour);
    return;
  }
  const cart = state.cart.map((i) =>
    i.id === id && i.size === size && i.colour === colour
      ? { ...i, quantity: qty }
      : i
  );
  setState({ cart });
}

// ── Wishlist helpers ─────────────────────────────────────────
export function getWishlist() {
  return [...state.wishlist];
}

export function isInWishlist(productId) {
  return state.wishlist.includes(productId);
}

export function toggleWishlist(productId) {
  const wishlist = isInWishlist(productId)
    ? state.wishlist.filter((id) => id !== productId)
    : [...state.wishlist, productId];
  setState({ wishlist });
  return !state.wishlist.includes(productId); // return new state before setState completes
}

export function removeFromWishlist(productId) {
  const wishlist = state.wishlist.filter((id) => id !== productId);
  setState({ wishlist });
}

export default {
  getState, setState, subscribe,
  getMode, setMode,
  getCart, getCartCount, getCartTotal, addToCart, removeFromCart, updateCartQty,
  getWishlist, isInWishlist, toggleWishlist, removeFromWishlist,
};

