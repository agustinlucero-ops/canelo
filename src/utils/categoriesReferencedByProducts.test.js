import { describe, expect, it } from "vitest";
import { categoriesReferencedByProducts } from "./categoriesReferencedByProducts.js";

describe("categoriesReferencedByProducts", () => {
  it("devuelve categorías de productos que no están en el catálogo", () => {
    const missing = categoriesReferencedByProducts(
      [{ category: "Congelados" }, { category: "Granolas" }],
      ["Granolas", "Frutos secos"]
    );

    expect(missing).toEqual(["Congelados"]);
  });

  it("no duplica ni incluye vacíos", () => {
    const missing = categoriesReferencedByProducts(
      [{ category: "Varios" }, { category: "Varios" }, { category: "  " }],
      ["Varios"]
    );

    expect(missing).toEqual([]);
  });
});
