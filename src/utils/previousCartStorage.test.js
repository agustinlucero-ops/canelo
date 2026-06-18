import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  dismissPreviousCartOffer,
  loadPreviousCartOffer,
  savePreviousCart,
} from "./previousCartStorage";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
}

describe("previousCartStorage", () => {
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00.000Z"));
  });

  it("ofrece restaurar el carrito anterior dentro de las 24 horas", () => {
    const items = [{ key: "a", name: "Almendra", quantity: 1 }];

    savePreviousCart(items, storage);
    expect(loadPreviousCartOffer(storage)).toEqual({
      items,
      dismissed: false,
    });
  });

  it("no ofrece carrito anterior vencido", () => {
    const items = [{ key: "a", name: "Almendra", quantity: 1 }];
    savePreviousCart(items, storage);

    vi.setSystemTime(new Date(Date.now() + TWENTY_FOUR_HOURS_MS + 1));

    expect(loadPreviousCartOffer(storage)).toBeNull();
  });

  it("oculta la oferta al descartar sin borrar el snapshot", () => {
    const items = [{ key: "a", name: "Almendra", quantity: 1 }];
    savePreviousCart(items, storage);

    dismissPreviousCartOffer(storage);

    expect(loadPreviousCartOffer(storage)).toBeNull();
  });

  it("reemplaza el carrito anterior al guardar uno nuevo", () => {
    savePreviousCart([{ key: "a", name: "Almendra", quantity: 1 }], storage);
    savePreviousCart([{ key: "b", name: "Nuez", quantity: 2 }], storage);

    expect(loadPreviousCartOffer(storage)?.items).toEqual([
      { key: "b", name: "Nuez", quantity: 2 },
    ]);
  });
});
