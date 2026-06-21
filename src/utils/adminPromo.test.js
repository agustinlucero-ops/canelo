import { describe, expect, it } from "vitest";
import {
  buildPromoPresentationUpdates,
  formatAdminPresentationsSummary,
  getPromoDiscountDraftValue,
  shouldShowPromoPresentationSelector,
  validatePromoDiscountInput,
} from "./adminPromo";

describe("formatAdminPresentationsSummary", () => {
  it("muestra descuento por presentación activo en la lista de gestión", () => {
    const summary = formatAdminPresentationsSummary([
      { label: "500g", price: 16000, discountPercent: 10 },
      { label: "1kg", price: 28000 },
    ]);

    expect(summary).toBe("500g: $16000 (10% OFF) · 1kg: $28000");
  });
});

describe("buildPromoPresentationUpdates", () => {
  const product = {
    presentations: [
      { label: "500g", price: 16000 },
      { label: "1kg", price: 28000, discountPercent: 5 },
    ],
  };

  it("aplica descuento solo en la presentación elegida", () => {
    expect(buildPromoPresentationUpdates(product, "500g", 10)).toEqual([
      { label: "500g", price: 16000, discountPercent: 10 },
      { label: "1kg", price: 28000 },
    ]);
  });

  it("quita promo solo en la presentación elegida", () => {
    expect(buildPromoPresentationUpdates(product, "1kg", null)).toEqual([
      { label: "500g", price: 16000 },
      { label: "1kg", price: 28000, discountPercent: null },
    ]);
  });
});

describe("validatePromoDiscountInput", () => {
  it("acepta un entero entre 1 y 99", () => {
    expect(validatePromoDiscountInput("10")).toEqual({ ok: true, value: 10 });
  });

  it("rechaza descuentos inválidos", () => {
    expect(validatePromoDiscountInput("150").ok).toBe(false);
    expect(validatePromoDiscountInput("").ok).toBe(false);
  });
});

describe("promo presentation helpers", () => {
  it("oculta selector con una sola presentación", () => {
    expect(shouldShowPromoPresentationSelector([{ label: "1u", price: 3200 }])).toBe(false);
    expect(
      shouldShowPromoPresentationSelector([
        { label: "500g", price: 16000 },
        { label: "1kg", price: 28000 },
      ])
    ).toBe(true);
  });

  it("pre-llena el descuento vigente de la presentación", () => {
    expect(getPromoDiscountDraftValue({ label: "500g", price: 16000, discountPercent: 10 })).toBe(
      "10"
    );
    expect(getPromoDiscountDraftValue({ label: "1kg", price: 28000 })).toBe("");
  });
});
