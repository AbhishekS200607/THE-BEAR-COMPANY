import { getCart, addToCart, removeFromCart, updateCartQty, getCartTotal, getCartCount, setState } from '../state/store.js';

export function cartGetCart() {
  return getCart();
}

/**
 * Flexible addItem supporting both:
 * 1. addItem({ id, name, price, size, colour, image, mode, quantity })
 * 2. addItem(product, colour, size, quantity)
 */
export function addItem(productOrItem, colour, size, quantity = 1) {
  if (productOrItem && typeof productOrItem === 'object' && productOrItem.size) {
    // Single payload object
    addToCart({
      id: productOrItem.id,
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
    // Positional arguments
    addToCart({
      id: productOrItem.id,
      slug: productOrItem.slug || productOrItem.id,
      name: productOrItem.name,
      price: productOrItem.price,
      colour: colour || 'Standard',
      size: size || 'M',
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
