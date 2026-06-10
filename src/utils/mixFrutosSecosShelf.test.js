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

  it("activa presentaciones en tarjeta para Mix cervecero fuera del estante Mix frutos secos", () => {
    expect(
      flavorLineShowsPresentationsOnCard({
        id: "mix-cervecero",
        category: "Maní suelto",
        productType: "flavor-line",
      })
    ).toBe(true);
  });

  it("activa presentaciones en tarjeta para Mix cervecero aunque el id no sea mix-cervecero", () => {
    expect(
      flavorLineShowsPresentationsOnCard({
        id: "producto-importado-12",
        name: "Mix cervecero",
        category: "Maní suelto",
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
