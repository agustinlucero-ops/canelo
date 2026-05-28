import { describe, expect, it } from "vitest";
import {
  GLUTEN_FREE_FILTER_CATEGORY,
  KETO_FILTER_CATEGORY,
  VEGAN_FILTER_CATEGORY,
  isShelfCategory,
  isStoreFilterCategory,
} from "./productCategories.js";

describe("isStoreFilterCategory", () => {
  it("identifica los filtros fijos de tienda", () => {
    expect(isStoreFilterCategory(GLUTEN_FREE_FILTER_CATEGORY)).toBe(true);
    expect(isStoreFilterCategory(KETO_FILTER_CATEGORY)).toBe(true);
    expect(isStoreFilterCategory(VEGAN_FILTER_CATEGORY)).toBe(true);
  });

  it("no marca categorías de estante como filtro", () => {
    expect(isStoreFilterCategory("Granolas")).toBe(false);
    expect(isStoreFilterCategory("Frutos secos")).toBe(false);
  });
});

describe("isShelfCategory", () => {
  it("es lo opuesto a filtro de tienda", () => {
    expect(isShelfCategory("Granolas")).toBe(true);
    expect(isShelfCategory("Keto")).toBe(false);
  });
});
