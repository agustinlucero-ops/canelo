const CART_SESSION_KEY = "canelo.cart.session";

export function loadCartSession(storage = getDefaultStorage()) {
  if (!storage) return [];

  const raw = storage.getItem(CART_SESSION_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCartSession(items, storage = getDefaultStorage()) {
  if (!storage) return;
  storage.setItem(CART_SESSION_KEY, JSON.stringify(items));
}

export function clearCartSession(storage = getDefaultStorage()) {
  if (!storage) return;
  storage.removeItem(CART_SESSION_KEY);
}

function getDefaultStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}
