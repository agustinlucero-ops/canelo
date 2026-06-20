import { describe, expect, it } from "vitest";
import { normalizeVariantImageForStorage, resolveVariantImage } from "./variantImage";
import { DEFAULT_PRODUCT_IMAGE } from "./sanitizeCatalog";

describe("resolveVariantImage", () => {
  it("muestra la foto de línea cuando el sabor no tiene foto propia", () => {
    const line = {
      image: "data:image/jpeg;base64,LINE",
    };
    const variant = { image: "" };

    expect(resolveVariantImage(variant, line)).toBe("data:image/jpeg;base64,LINE");
  });

  it("muestra la foto de línea cuando el sabor tiene placeholder genérico", () => {
    const line = {
      image: "data:image/jpeg;base64,LINE",
    };
    const variant = { image: DEFAULT_PRODUCT_IMAGE };

    expect(resolveVariantImage(variant, line)).toBe("data:image/jpeg;base64,LINE");
  });

  it("muestra la foto del sabor cuando hay override real", () => {
    const line = {
      image: "data:image/jpeg;base64,LINE",
    };
    const variant = { image: "data:image/jpeg;base64,CACAO" };

    expect(resolveVariantImage(variant, line)).toBe("data:image/jpeg;base64,CACAO");
  });

  it("muestra la foto de línea cuando el sabor repite la misma url", () => {
    const line = {
      image: "/images/products/granola.svg",
    };
    const variant = { image: "/images/products/granola.svg" };

    expect(resolveVariantImage(variant, line)).toBe("/images/products/granola.svg");
  });
});

describe("normalizeVariantImageForStorage", () => {
  it("persiste vacío cuando el sabor hereda la foto de línea", () => {
    expect(
      normalizeVariantImageForStorage(DEFAULT_PRODUCT_IMAGE, "data:image/jpeg;base64,LINE")
    ).toBe("");
  });

  it("persiste la url cuando el sabor tiene override real", () => {
    expect(
      normalizeVariantImageForStorage(
        "data:image/jpeg;base64,CACAO",
        "data:image/jpeg;base64,LINE"
      )
    ).toBe("data:image/jpeg;base64,CACAO");
  });
});
