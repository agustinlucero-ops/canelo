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
});
