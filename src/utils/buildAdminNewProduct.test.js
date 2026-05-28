import { describe, expect, it } from "vitest";
import { PRODUCT_TYPE_FLAVOR_LINE } from "./sanitizeCatalog";
import { buildAdminNewProduct } from "./buildAdminNewProduct";

describe("buildAdminNewProduct", () => {
  const base = {
    id: "mani-saborizado",
    name: "Mani saborizado",
    category: "Maní suelto",
    image: "/images/products/mani.svg",
    isVegan: false,
    isKeto: false,
    isGlutenFree: false,
    presentations: [{ label: "1kg", price: 7500 }],
    productType: "simple",
  };

  it("producto simple no incluye sabores", () => {
    const product = buildAdminNewProduct(base);

    expect(product.productType).toBe("simple");
    expect(product.variants).toEqual([]);
  });

  it("incluye shelfNote solo en producto simple", () => {
    const product = buildAdminNewProduct({
      ...base,
      shelfNote: "sin piel",
    });

    expect(product.shelfNote).toBe("sin piel");
  });

  it("no incluye shelfNote en línea con sabores", () => {
    const product = buildAdminNewProduct({
      ...base,
      shelfNote: "ignorado",
      productType: PRODUCT_TYPE_FLAVOR_LINE,
    });

    expect(product.shelfNote).toBeUndefined();
  });

  it("línea con sabores incluye dos placeholders", () => {
    const product = buildAdminNewProduct({
      ...base,
      productType: PRODUCT_TYPE_FLAVOR_LINE,
    });

    expect(product.productType).toBe(PRODUCT_TYPE_FLAVOR_LINE);
    expect(product.variants).toHaveLength(2);
    expect(product.variants[0].label).toBe("Sabor 1");
    expect(product.variants[1].id).toBe("mani-saborizado-sabor-2");
  });

  it("producto con sabores usa tipo flavored", () => {
    const product = buildAdminNewProduct({
      ...base,
      productType: "flavored",
    });

    expect(product.productType).toBe("flavored");
    expect(product.variants).toHaveLength(2);
  });

  it("conserva varias presentaciones al crear", () => {
    const product = buildAdminNewProduct({
      ...base,
      presentations: [
        { label: "500g", price: 4000 },
        { label: "1kg", price: 7500 },
      ],
    });

    expect(product.presentations).toEqual([
      { label: "500g", price: 4000 },
      { label: "1kg", price: 7500 },
    ]);
  });

  it("usa sabores provistos en línea de producto en lugar de placeholders", () => {
    const product = buildAdminNewProduct({
      ...base,
      productType: PRODUCT_TYPE_FLAVOR_LINE,
      variants: [
        {
          id: "cuca-chocolate",
          label: "Chocolate",
          image: "/images/products/granola.svg",
          description: "",
          contents: [],
          isVegan: false,
          outOfStock: false,
        },
      ],
    });

    expect(product.variants).toHaveLength(1);
    expect(product.variants[0].label).toBe("Chocolate");
  });
});
