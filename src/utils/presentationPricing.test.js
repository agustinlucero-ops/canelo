import { describe, expect, it } from "vitest";
import { resolvePresentationPricing } from "./presentationPricing";

describe("resolvePresentationPricing", () => {
  it("sin descuento, precio de venta igual al precio de lista", () => {
    const pricing = resolvePresentationPricing({ label: "1kg", price: 28000 });

    expect(pricing).toEqual({
      listPrice: 28000,
      salePrice: 28000,
      promoLabel: null,
      hasDiscount: false,
    });
  });

  it("aplica descuento por presentación al precio de venta", () => {
    const pricing = resolvePresentationPricing({
      label: "500g",
      price: 16000,
      discountPercent: 10,
    });

    expect(pricing).toEqual({
      listPrice: 16000,
      salePrice: 14400,
      promoLabel: "10% OFF",
      hasDiscount: true,
    });
  });

  it("redondea el precio de venta al entero más cercano", () => {
    const pricing = resolvePresentationPricing({
      label: "500g",
      price: 5555,
      discountPercent: 10,
    });

    expect(pricing.salePrice).toBe(5000);
  });

  it("descarta descuento inválido y usa precio de lista como precio de venta", () => {
    const pricing = resolvePresentationPricing({
      label: "500g",
      price: 16000,
      discountPercent: 150,
    });

    expect(pricing).toEqual({
      listPrice: 16000,
      salePrice: 16000,
      promoLabel: null,
      hasDiscount: false,
    });
  });
});
