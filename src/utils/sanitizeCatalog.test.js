import { describe, expect, it } from "vitest";
import {
  sanitizePresentations,
  sanitizeProducts,
  sanitizeShelfNote,
  sanitizeVariants,
} from "./sanitizeCatalog";

describe("sanitizeShelfNote", () => {
  it("truncates text longer than 50 characters", () => {
    const longText = "a".repeat(60);
    expect(sanitizeShelfNote(longText)).toHaveLength(50);
    expect(sanitizeShelfNote(longText)).toBe("a".repeat(50));
  });
});

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

describe("sanitizeVariants", () => {
  it("genera ids unicos cuando vienen repetidos", () => {
    const result = sanitizeVariants([
      { id: "mani-sabor", label: "Azucarados" },
      { id: "mani-sabor", label: "Sin azúcar" },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ id: "mani-sabor", label: "Azucarados" }),
      expect.objectContaining({ id: "mani-sabor-2", label: "Sin azúcar" }),
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

  it("keeps shelfNote on a simple product when provided", () => {
    const [product] = sanitizeProducts([
      {
        id: "almendra",
        name: "Almendra",
        category: "Frutos secos",
        shelfNote: "  sin piel  ",
        presentations: [{ label: "1kg", price: 10000 }],
      },
    ]);

    expect(product.shelfNote).toBe("sin piel");
  });

  it("drops shelfNote on flavor-line products", () => {
    const [line] = sanitizeProducts([
      {
        id: "granola-cuca",
        name: "Granola CUCA",
        category: "Granolas",
        productType: "flavor-line",
        shelfNote: "no debería quedar",
        presentations: [{ label: "1kg", price: 10300 }],
        variants: [{ id: "cuca-tradicional", label: "Tradicional" }],
      },
    ]);

    expect(line.shelfNote).toBeUndefined();
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

  it("keeps a flavored product with sabores en tarjeta", () => {
    const [product] = sanitizeProducts([
      {
        id: "mani-saborizado",
        name: "Mani saborizado",
        category: "Maní suelto",
        productType: "flavored",
        presentations: [{ label: "1kg", price: 7500 }],
        variants: [{ id: "mani-bbq", label: "BBQ" }],
      },
    ]);

    expect(product).toMatchObject({
      id: "mani-saborizado",
      productType: "flavored",
      variants: [{ id: "mani-bbq", label: "BBQ" }],
    });
  });
});
