import { describe, expect, it } from "vitest";
import { buildCartPresentationFields } from "./cartItemPricing";

describe("buildCartPresentationFields", () => {
  it("congela precio de venta, precio de lista y descuento al agregar al carrito", () => {
    expect(
      buildCartPresentationFields({ label: "500g", price: 16000, discountPercent: 10 })
    ).toEqual({
      unitPrice: 14400,
      listPrice: 16000,
      discountPercent: 10,
    });
  });

  it("sin descuento solo guarda precios iguales", () => {
    expect(buildCartPresentationFields({ label: "1kg", price: 28000 })).toEqual({
      unitPrice: 28000,
      listPrice: 28000,
    });
  });
});
