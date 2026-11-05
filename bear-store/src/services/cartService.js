import { getCart, addToCart, removeFromCart, updateCartQty, getCartTotal, getCartCount, setState } from '../state/store.js';

export function cartGetCart() {
  return getCart();
}

/**
 * Flexible addItem supporting both:
 * 1. addItem({ id, name, price, size, colour, image, mode, quantity, variantId })
 * 2. addItem(product, colour, size, quantity)
 */
export function addItem(productOrItem, colour, size, quantity = 1) {
  if (productOrItem && typeof productOrItem === 'object' && productOrItem.size && !productOrItem.sizes) {
    // Single item payload object
    addToCart({
      id: productOrItem.id,
      variantId: productOrItem.variantId || null,
      slug: productOrItem.slug || productOrItem.id,
      name: productOrItem.name,
      price: productOrItem.price,
      colour: productOrItem.colour || 'Standard',
      size: productOrItem.size,
      quantity: productOrItem.quantity || 1,
      image: productOrItem.image || (productOrItem.images && productOrItem.images[0]) || '',
      mode: productOrItem.mode || 'bear',
    });
  } else {
    // Product object + positional arguments
    const chosenSize = size || (productOrItem?.sizes && productOrItem.sizes[0]?.size) || 'M';
    const chosenColour = colour || (productOrItem?.colours && productOrItem.colours[0]?.name) || 'Standard';

    // Resolve real Supabase variantId (checking variants first for exact colour+size match)
    let resolvedVariantId = productOrItem?.variantId || null;
    if (!resolvedVariantId && Array.isArray(productOrItem?.variants)) {
      const match = productOrItem.variants.find(
        (v) => v.size === chosenSize && (!v.colour || v.colour.toLowerCase() === chosenColour.toLowerCase())
      );
      if (match?.variantId) {
        resolvedVariantId = match.variantId;
      }
    }
    if (!resolvedVariantId && Array.isArray(productOrItem?.sizes)) {
      const match =
        productOrItem.sizes.find((s) => s.size === chosenSize && (!s.colour || s.colour === chosenColour)) ||
        productOrItem.sizes.find((s) => s.size === chosenSize) ||
        productOrItem.sizes[0];
      if (match?.variantId) {
        resolvedVariantId = match.variantId;
      }
    }

    addToCart({
      id: productOrItem.id,
      variantId: resolvedVariantId,
      slug: productOrItem.slug || productOrItem.id,
      name: productOrItem.name,
      price: productOrItem.price,
      colour: chosenColour,
      size: chosenSize,
      quantity: quantity || 1,
      image: (productOrItem.images && productOrItem.images[0]) || productOrItem.image || '',
      mode: productOrItem.mode || 'bear',
    });
  }
}

export function removeItem(productId, size, colour) {
  removeFromCart(productId, size, colour);
}

export function updateQuantity(productId, size, colour, newQty) {
  updateCartQty(productId, size, colour, newQty);
}

export function clearCart() {
  setState({ cart: [] });
}

export function getTotal() {
  return getCartTotal();
}

export function getItemCount() {
  return getCartCount();
}

export default { cartGetCart, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount };
