import { getWishlist, isInWishlist, toggleWishlist as storeToggle } from '../state/store.js';

export function getWishlistItems() {
  return getWishlist();
}

export function toggle(productId) {
  storeToggle(productId);
  return !isInWishlist(productId);
}

export function isWishlisted(productId) {
  return isInWishlist(productId);
}

export default { getWishlistItems, toggle, isWishlisted };

