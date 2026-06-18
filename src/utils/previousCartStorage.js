const PREVIOUS_CART_KEY = "canelo.cart.previous";
const PREVIOUS_CART_TTL_MS = 24 * 60 * 60 * 1000;

export function savePreviousCart(items, storage = getDefaultStorage()) {
  if (!storage) return;

  storage.setItem(
    PREVIOUS_CART_KEY,
    JSON.stringify({
      items,
      savedAt: Date.now(),
      dismissed: false,
    })
  );
}

export function loadPreviousCartOffer(storage = getDefaultStorage()) {
  if (!storage) return null;

  const raw = storage.getItem(PREVIOUS_CART_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.dismissed) return null;
    if (!Array.isArray(parsed.items) || !parsed.savedAt) return null;
    if (Date.now() - parsed.savedAt > PREVIOUS_CART_TTL_MS) return null;

    return {
      items: parsed.items,
      dismissed: false,
    };
  } catch {
    return null;
  }
}

export function dismissPreviousCartOffer(storage = getDefaultStorage()) {
  if (!storage) return null;

  const raw = storage.getItem(PREVIOUS_CART_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed) return null;

    storage.setItem(
      PREVIOUS_CART_KEY,
      JSON.stringify({
        ...parsed,
        dismissed: true,
      })
    );
    return true;
  } catch {
    return null;
  }
}

function getDefaultStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}
