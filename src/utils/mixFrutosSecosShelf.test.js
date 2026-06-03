import { describe, expect, it } from "vitest";
import {
  MIX_FRUTOS_SECOS_CATEGORY,
  flavorLineShowsPresentationsOnCard,
} from "./mixFrutosSecosShelf";

describe("mixFrutosSecosShelf", () => {
  it("activa presentaciones en tarjeta para líneas de producto en Mix frutos secos", () => {
    expect(
      flavorLineShowsPresentationsOnCard({
        category: MIX_FRUTOS_SECOS_CATEGORY,
        productType: "flavor-line",
      })
    ).toBe(true);
  });

  it("no activa presentaciones en tarjeta para granolas u otras categorías", () => {
    expect(
      flavorLineShowsPresentationsOnCard({
        category: "Granolas",
        productType: "flavor-line",
      })
    ).toBe(false);
  });
});
