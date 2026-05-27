import { describe, expect, it } from "vitest";
import { sanitizePresentations, sanitizeProducts } from "./sanitizeCatalog";

describe("sanitizePresentations", () => {
  it("filters invalid entries and rounds prices", () => {
    const result = sanitizePresentations([
      { label: "1kg", price: 1500.6 },
      { label: "", price: 100 },
      { label: "500g", price: 2500 },
    ]);

    expect(result).toEqual([
      { label: "1kg", price: 1501 },
      { label: "500g", price: 2500 },
    ]);
  });
});

describe("sanitizeProducts", () => {
  it("normalizes product fields", () => {
    const [product] = sanitizeProducts([
      {
        id: "almendra",
        name: "Almendra",
        category: "Frutos secos",
        presentations: [{ label: "1kg", price: 10000 }],
        isVegan: true,
      },
    ]);

    expect(product).toMatchObject({
      id: "almendra",
      category: "Frutos secos",
      isVegan: true,
      presentations: [{ label: "1kg", price: 10000 }],
    });
    expect(product.name).toBeTruthy();
    expect(product.image).toContain("/images/");
  });

  it("keeps a flavor-line with sanitized variants", () => {
    const [line] = sanitizeProducts([
      {
        id: "granola-cuca",
        name: "Granola CUCA",
        category: "Granolas",
        productType: "flavor-line",
        presentations: [{ label: "1kg", price: 10300 }],
        variants: [
          {
            id: "cuca-tradicional",
            label: "Tradicional",
            image: "/images/products/granola.svg",
            description: "Clásica y crocante.",
            contents: ["Avena", "Miel"],
            isVegan: false,
          },
        ],
      },
    ]);

    expect(line).toMatchObject({
      id: "granola-cuca",
      productType: "flavor-line",
      presentations: [{ label: "1kg", price: 10300 }],
      variants: [
        {
          id: "cuca-tradicional",
          label: "Tradicional",
          description: "Clásica y crocante.",
          contents: ["Avena", "Miel"],
          isVegan: false,
          outOfStock: false,
        },
      ],
    });
    expect(line.variants[0].image).toContain("/images/");
  });
});
