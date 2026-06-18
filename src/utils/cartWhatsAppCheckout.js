export function runWhatsAppCheckout({ items, onSavePreviousCart, clearCart }) {
  if (!items.length) {
    return false;
  }

  onSavePreviousCart(items);
  clearCart();
  return true;
}
