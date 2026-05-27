import { describe, expect, it } from "vitest";
import { buildFlavorLineCartItem } from "./flavorLineCart";

describe("buildFlavorLineCartItem", () => {
  const line = {
    id: "granola-cuca",
    name: "Granola CUCA",
    image: "/images/products/granola.svg",
  };
  const variant = {
    id: "cuca-tradicional",
    label: "Tradicional",
    image: "/images/products/granola-tradicional.svg",
  };
  const presentation = { label: "1kg", price: 10300 };

  it("builds a cart line with line name, flavor, and variant id", () => {
    const item = buildFlavorLineCartItem({ line, variant, presentation });

    expect(item).toEqual({
      key: "cuca-tradicional-1kg",
      productId: "cuca-tradicional",
      lineId: "granola-cuca",
      flavorLabel: "Tradicional",
      name: "Granola CUCA — Tradicional",
      image: "/images/products/granola-tradicional.svg",
      presentation: "1kg",
      unitPrice: 10300,
      quantity: 1,
    });
  });
});
