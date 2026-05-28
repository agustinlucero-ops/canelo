import { describe, expect, it } from "vitest";
import { validateAdminNewProduct } from "./validateAdminNewProduct";

describe("validateAdminNewProduct", () => {
  const base = {
    name: "Almendra",
    category: "Frutos secos",
    categoryExists: true,
    presentations: [{ label: "1kg", price: "7500" }],
    productType: "simple",
    variants: [],
  };

  it("rechaza cuando no hay presentación válida", () => {
    const error = validateAdminNewProduct({
      ...base,
      presentations: [{ label: "", price: "" }],
    });

    expect(error).toMatch(/presentación/i);
  });

  it("exige al menos un sabor con nombre para línea de producto", () => {
    const error = validateAdminNewProduct({
      ...base,
      productType: "flavor-line",
      variants: [{ id: "s-1", label: "", image: "" }],
    });

    expect(error).toMatch(/sabor/i);
  });
});
