import { describe, expect, it } from "vitest";
import { normalizeProductName } from "./productName";
import { sanitizeProducts } from "./sanitizeCatalog";

describe("normalizeProductName", () => {
  it("conserva mayúsculas y minúsculas del nombre", () => {
    expect(normalizeProductName("tutti grani", "Granolas")).toBe("tutti grani");
    expect(normalizeProductName("TUTTI GRANI", "Granolas")).toBe("TUTTI GRANI");
  });

  it("quita el prefijo Granola solo en categoría Granolas", () => {
    expect(normalizeProductName("Granola tutti grani", "Granolas")).toBe("tutti grani");
    expect(normalizeProductName("Granola CUCA", "Frutos secos")).toBe("Granola CUCA");
  });
});

describe("sanitizeProducts — nombre", () => {
  it("no fuerza mayúsculas en marcas de granola", () => {
    const [line] = sanitizeProducts([
      {
        id: "granola-tutti",
        name: "tutti grani",
        category: "Granolas",
        productType: "flavor-line",
        presentations: [{ label: "1kg", price: 10000 }],
        variants: [{ id: "tradicional", label: "Tradicional" }],
      },
    ]);

    expect(line.name).toBe("tutti grani");
  });
});
