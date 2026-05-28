import { describe, expect, it } from "vitest";
import { buildDisplayCategoryOrder } from "./buildDisplayCategoryOrder.js";

describe("buildDisplayCategoryOrder", () => {
  it("muestra filtros de tienda antes que categorías de estante", () => {
    const order = buildDisplayCategoryOrder({
      apiCategories: [
        { name: "Frutos secos", sortOrder: 1 },
        { name: "Sin tacc", sortOrder: 0 },
        { name: "Granolas", sortOrder: 2 },
        { name: "Keto", sortOrder: 3 },
        { name: "Veganos", sortOrder: 4 },
      ],
      products: [],
    });

    expect(order.indexOf("Sin tacc")).toBeLessThan(order.indexOf("Granolas"));
    expect(order.indexOf("Keto")).toBeLessThan(order.indexOf("Frutos secos"));
    expect(order.indexOf("Veganos")).toBeLessThan(order.indexOf("Frutos secos"));
  });

  it("ordena estantes según sort_order de la API", () => {
    const order = buildDisplayCategoryOrder({
      apiCategories: [
        { name: "Frutos secos", sortOrder: 5 },
        { name: "Granolas", sortOrder: 1 },
      ],
      products: [],
    });

    const granolasIndex = order.indexOf("Granolas");
    const frutosIndex = order.indexOf("Frutos secos");
    expect(granolasIndex).toBeGreaterThan(-1);
    expect(frutosIndex).toBeGreaterThan(granolasIndex);
  });

  it("incorpora categorías solo presentes en productos como estantes al final", () => {
    const order = buildDisplayCategoryOrder({
      apiCategories: [{ name: "Granolas", sortOrder: 0 }],
      products: [{ category: "Zzz prueba" }, { category: "Aaa huérfana" }],
    });

    expect(order.indexOf("Granolas")).toBeGreaterThan(-1);
    expect(order.indexOf("Aaa huérfana")).toBeGreaterThan(order.indexOf("Granolas"));
    expect(order.indexOf("Zzz prueba")).toBeGreaterThan(order.indexOf("Aaa huérfana"));
  });
});
