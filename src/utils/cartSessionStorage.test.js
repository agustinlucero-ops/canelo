import { beforeEach, describe, expect, it } from "vitest";
import { clearCartSession, loadCartSession, saveCartSession } from "./cartSessionStorage";

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
}

describe("cartSessionStorage", () => {
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it("restaura el carrito activo guardado en la pestaña", () => {
    const items = [
      {
        key: "almendra-1kg",
        productId: "almendra",
        name: "Almendra",
        presentation: "1kg",
        unitPrice: 1000,
        quantity: 2,
      },
    ];

    saveCartSession(items, storage);
    expect(loadCartSession(storage)).toEqual(items);
  });

  it("devuelve carrito vacío si no hay datos guardados", () => {
    expect(loadCartSession(storage)).toEqual([]);
  });
});
