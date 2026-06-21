import { describe, expect, it } from "vitest";
import { cartInitialState, cartReducer, computeCartTotals } from "./cartReducer";

describe("cartReducer", () => {
  const product = {
    id: "almendra",
    name: "Almendra",
    image: "/images/products/almendra.svg",
  };
  const presentation = { label: "1kg", price: 1000 };

  it("adds and increments items", () => {
    const first = cartReducer(cartInitialState, {
      type: "ADD_ITEM",
      payload: { product, presentation },
    });
    const second = cartReducer(first, {
      type: "ADD_ITEM",
      payload: { product, presentation },
    });

    expect(second.items).toHaveLength(1);
    expect(second.items[0].quantity).toBe(2);
  });

  it("cobra precio de venta cuando la presentación tiene descuento", () => {
    const state = cartReducer(cartInitialState, {
      type: "ADD_ITEM",
      payload: {
        product,
        presentation: { label: "500g", price: 16000, discountPercent: 10 },
      },
    });

    expect(state.items[0].unitPrice).toBe(14400);
    expect(state.items[0].listPrice).toBe(16000);
    expect(state.items[0].discountPercent).toBe(10);
  });

  it("adds a flavor-line item with line and flavor in the name", () => {
    const state = cartReducer(cartInitialState, {
      type: "ADD_FLAVOR_LINE_ITEM",
      payload: {
        line: {
          id: "granola-cuca",
          name: "Granola CUCA",
          image: "/images/products/granola.svg",
        },
        variant: {
          id: "cuca-tradicional",
          label: "Tradicional",
          image: "/images/products/granola.svg",
        },
        presentation: { label: "1kg", price: 10300 },
      },
    });

    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({
      productId: "cuca-tradicional",
      lineId: "granola-cuca",
      name: "Granola CUCA — Tradicional",
      presentation: "1kg",
      unitPrice: 10300,
    });
  });

  it("computes totals", () => {
    const state = cartReducer(cartInitialState, {
      type: "ADD_ITEM",
      payload: { product, presentation },
    });

    expect(computeCartTotals(state.items)).toEqual({
      subtotal: 1000,
      total: 1000,
      totalItems: 1,
    });
  });

  it("restores items from a previous cart snapshot", () => {
    const items = [
      {
        key: "almendra-1kg",
        productId: "almendra",
        name: "Almendra",
        presentation: "1kg",
        unitPrice: 1000,
        quantity: 1,
      },
    ];

    const state = cartReducer(cartInitialState, {
      type: "RESTORE_ITEMS",
      payload: { items },
    });

    expect(state.items).toEqual(items);
  });
});
